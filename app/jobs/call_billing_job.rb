class CallBillingJob < ApplicationJob
  queue_as :billing
  
  # This job calculates the cost of the call and deducts credits from the user
  def perform(call_id)
    call = Call.find_by(id: call_id)
    return unless call
    
    # Skip billing if call was not completed or doesn't have duration
    return if !['completed', 'terminated'].include?(call.status) || call.duration.nil?
    
    service = CallService.new(call)
    user = call.user
    
    # Calculate the final cost
    cost = service.calculate_cost(call.duration)
    
    ActiveRecord::Base.transaction do
      # Update the call with the final cost
      call.update!(cost: cost)
      
      # Create a credit transaction for this call
      CreditTransaction.create!(
        user: user,
        amount: -cost, # Negative amount for deduction
        transaction_type: 'call_charge',
        description: "Call to #{call.phone_number} (#{call.duration}s)",
        reference_id: call.id,
        reference_type: 'Call'
      )
      
      # Update user's credit balance
      user.deduct_credits(cost)
      
      # Create a call event for the billing
      CallEvent.create!(
        call: call,
        event_type: 'completed',
        occurred_at: Time.current,
        metadata: { 
          cost: cost.to_f,
          duration: call.duration,
          currency: cost.currency.iso_code
        }
      )
    end
  rescue => e
    # Log billing error but don't fail the call
    Rails.logger.error "Error billing call #{call_id}: #{e.message}"
    
    if call
      CallEvent.create!(
        call: call,
        event_type: 'billing_failed',
        occurred_at: Time.current,
        metadata: { error: e.message }
      )
    end
  end
end
