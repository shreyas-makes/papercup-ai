# Service for calculating call costs based on duration and rate
class CallCostCalculator
  attr_reader :call, :rate

  # Initialize with a call object and optional rate
  # @param call [Call] the call to calculate cost for
  # @param rate [CallRate] optional pre-fetched rate
  def initialize(call, rate = nil)
    @call = call
    @rate = rate || find_rate
  end

  # Calculate the cost of the call
  # @return [Money] the calculated cost
  def calculate
    return Money.new(0) unless rate && call.duration_seconds && call.duration_seconds > 0

    # Calculate the duration in minutes (rounded up to the nearest minute)
    duration_minutes = (call.duration_seconds.to_f / 60).ceil
    
    # Calculate the cost
    cost = rate.rate_per_min * duration_minutes
    
    # Return the cost
    cost
  end
  
  # Apply the calculated cost to the call
  # @return [Boolean] success status
  def apply_cost!
    cost = calculate
    call.update(cost_cents: cost.cents)
  end

  private
  
  # Find the rate for this call if not provided
  # @return [CallRate] the applicable call rate
  def find_rate
    CallRate.find_rate_for_number(call.phone_number, call.country_code)
  end
end 