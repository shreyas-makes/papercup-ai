class CallService
  # Service to handle call operations
  
  def initialize(call)
    @call = call
    @user = call.user
    @twilio_client = Twilio::REST::Client.new
  end

  def initiate
    unless @user.has_sufficient_credits?(@call.country_code)
      @call.update(status: 'failed', failure_reason: 'insufficient_credits')
      return { success: false, error: 'Insufficient credits' }
    end

    begin
      @call.update(status: 'initiated', start_time: Time.current)
      create_call_event('initiated')
      
      InitiateCallJob.perform_later(@call.id)
      
      return { success: true, call: @call }
    rescue => e
      @call.update(status: 'failed', failure_reason: 'system_error')
      create_call_event('failed', { error: e.message })
      return { success: false, error: e.message }
    end
  end

  def update_status(status, duration = nil)
    previous_status = @call.status
    
    @call.update(
      status: status,
      duration: duration || @call.duration
    )
    
    # If call is completed or terminated, perform billing
    if ['completed', 'terminated'].include?(status) && previous_status != status
      @call.end_time = Time.current
      @call.save
      
      CallBillingJob.perform_later(@call.id)
    end
    
    create_call_event(status)
    
    { success: true, call: @call }
  end

  def terminate
    begin
      # Call Twilio API to terminate the call
      if @call.twilio_sid.present?
        @twilio_client.calls(@call.twilio_sid).update(status: 'completed')
      end
      
      update_status('terminated')
      
      { success: true, call: @call }
    rescue => e
      create_call_event('terminate_failed', { error: e.message })
      { success: false, error: e.message }
    end
  end

  def calculate_cost(duration)
    # Get the call rate for this destination
    rate = CallRate.find_rate_for_number(@call.phone_number, @call.country_code)
    
    if rate.nil?
      # Use default rate if no specific rate is found
      default_rate = Money.new(50, 'USD') # $0.50 per minute as default
      return (duration.to_f / 60) * default_rate
    end

    # Calculate cost based on duration (converted to minutes) and rate
    (duration.to_f / 60) * rate.rate_per_min
  end
  
  private
  
  def create_call_event(event_type, metadata = {})
    CallEvent.create!(
      call: @call,
      event_type: event_type,
      occurred_at: Time.current,
      metadata: metadata
    )
  end
end 