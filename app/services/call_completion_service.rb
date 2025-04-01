# Service for handling call completion and charging the user
class CallCompletionService
  attr_reader :call

  # Initialize with a call object
  # @param call [Call] the call to complete
  def initialize(call)
    @call = call
  end

  # Complete the call, calculate costs, and charge the user
  # @param duration_seconds [Integer] the final duration of the call
  # @return [Boolean] success status
  def complete!(duration_seconds)
    ActiveRecord::Base.transaction do
      update_call_duration(duration_seconds)
      calculate_call_cost
      charge_user_for_call
      mark_call_as_completed
    end
    true
  rescue StandardError => e
    Rails.logger.error "Call completion failed: #{e.message}"
    mark_call_as_failed
    false
  end

  private

  # Update the call with the actual duration
  # @param duration_seconds [Integer] the duration in seconds
  def update_call_duration(duration_seconds)
    call.update!(duration_seconds: duration_seconds)
  end

  # Calculate the cost of the call
  def calculate_call_cost
    calculator = CallCostCalculator.new(call)
    calculator.apply_cost!
  end

  # Charge the user for the call
  def charge_user_for_call
    return true unless call.cost.cents > 0
    
    # Create a credit transaction for the call charge
    credit_service = CreditService.new(
      call.user,
      call.cost,
      'call_charge'
    )
    
    # Process the transaction
    result = credit_service.process!
    
    unless result
      raise "Failed to charge user for call"
    end
  end

  # Mark the call as completed
  def mark_call_as_completed
    call.update!(status: 'completed')
  end

  # Mark the call as failed
  def mark_call_as_failed
    call.update(status: 'failed')
  end
end 