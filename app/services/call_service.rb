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
      
      # Note: twilio_sid will be stored in InitiateCallJob, not here
      # See line 69 in app/jobs/initiate_call_job.rb which does:
      # call.update(twilio_sid: twilio_call.sid, status: 'in_progress')
      
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
      Rails.logger.info "Attempting to terminate call ID: #{@call.id}, Twilio SID: #{@call.twilio_sid}"
      
      # Check if Twilio SID is present
      unless @call.twilio_sid.present?
        Rails.logger.warn "Twilio SID is blank for call ID: #{@call.id}. Cannot terminate via Twilio API."
        # Update status locally even if Twilio API can't be called
        update_status('terminated')
        # Return success as we've marked it terminated locally, though Twilio state might differ
        return { success: true, call: @call } 
      end
      
      # Call Twilio API to terminate the call
      Rails.logger.info "Calling Twilio API to update call #{@call.twilio_sid} to 'completed'"
      twilio_call = @twilio_client.calls(@call.twilio_sid).update(status: 'completed')
      Rails.logger.info "Twilio API response: #{twilio_call.inspect}"
      
      # Update local status and queue billing job
      update_status('terminated')
      
      { success: true, call: @call }
    rescue Exception => e # Catch Exception to get more details on errors
      Rails.logger.error "Error terminating call ID: #{@call.id}, SID: #{@call.twilio_sid}. Error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      create_call_event('terminate_failed', { error: "#{e.class}: #{e.message}" })
      { success: false, error: "Failed to terminate call: #{e.message}" }
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