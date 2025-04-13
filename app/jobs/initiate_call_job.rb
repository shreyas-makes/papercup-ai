class InitiateCallJob < ApplicationJob
  queue_as :calls
  
  include Rails.application.routes.url_helpers
  
  # This job handles the initial setup of a call through Twilio
  # It will update the call status as it proceeds
  def perform(call_id)
    call = Call.find_by(id: call_id)
    return unless call
    
    Rails.logger.info "======== STARTING CALL INITIATION ========"
    Rails.logger.info "Call ID: #{call.id}, Phone: #{call.phone_number}"
    Rails.logger.info "APP_HOST before cleanup: #{ENV['APP_HOST']}"
    
    service = CallService.new(call)
    
    begin
      # Initialize Twilio client
      twilio_client = Twilio::REST::Client.new(ENV['TWILIO_ACCOUNT_SID'], ENV['TWILIO_AUTH_TOKEN'])
      Rails.logger.info "Twilio client initialized with SID: #{ENV['TWILIO_ACCOUNT_SID']}"
      
      # Log the webhook URLs
      webhook = webhook_url(call)
      callback = status_callback_url(call)
      Rails.logger.info "Webhook URL: #{webhook}"
      Rails.logger.info "Status Callback URL: #{callback}"
      
      # Make the call through Twilio
      Rails.logger.info "Attempting to create Twilio call..."
      
      # Ensure phone number is properly formatted with country code
      to_number = call.phone_number

      # Check if country code is already included in phone number
      if to_number.start_with?('+')
        Rails.logger.info "Phone number already includes country code: #{to_number}"
      else
        # Add country code from call record
        country_code = call.country_code.to_s.strip
        
        # Ensure country code starts with + but doesn't have duplicate +
        country_code = "+#{country_code.gsub('+', '')}" unless country_code.start_with?('+')
        
        # Add country code to phone number
        to_number = "#{country_code}#{to_number}"
        Rails.logger.info "Added country code to phone number: #{to_number}"
      end
      
      # Ensure from number is properly formatted
      from_number = ENV['TWILIO_PHONE_NUMBER']
      unless from_number.start_with?('+')
        from_number = "+#{from_number}"
      end
      
      Rails.logger.info "Calling TO: #{to_number}, FROM: #{from_number}"
      
      twilio_call = twilio_client.calls.create(
        url: webhook,
        to: to_number,
        from: from_number,
        status_callback: callback,
        status_callback_event: ['initiated', 'ringing', 'answered', 'completed'],
        status_callback_method: 'POST'
      )
      
      Rails.logger.info "Twilio call created successfully! SID: #{twilio_call.sid}"
      
      # Store the Twilio SID for future reference
      call.update(twilio_sid: twilio_call.sid, status: 'in_progress')
      
      # Create an event for the status update
      CallEvent.create!(
        call: call,
        event_type: 'in_progress',
        occurred_at: Time.current
      )
      
    rescue Twilio::REST::RestError => e
      Rails.logger.error "Twilio API Error: #{e.code} - #{e.message}"
      call.update(status: 'failed', failure_reason: "twilio:#{e.code}")
      
      CallEvent.create!(
        call: call,
        event_type: 'failed',
        occurred_at: Time.current,
        metadata: { 
          error_code: e.code, 
          error_message: e.message 
        }
      )
      
    rescue => e
      Rails.logger.error "General Error in call initiation: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      call.update(status: 'failed', failure_reason: 'system_error')
      
      CallEvent.create!(
        call: call,
        event_type: 'failed',
        occurred_at: Time.current,
        metadata: { error: e.message }
      )
    end
    
    Rails.logger.info "======== FINISHED CALL INITIATION ========"
  end
  
  private
  
  # Generate webhook URL for TwiML - manually construct the URL to avoid port issues
  def webhook_url(call)
    # Get clean host without any port number
    host = ENV['APP_HOST'].to_s.strip
    Rails.logger.info "Host for webhook: #{host}"
    
    # Ensure the host doesn't already have https:// prefix
    unless host.start_with?('http://') || host.start_with?('https://')
      host = "https://#{host}"
    end
    
    # Ensure no trailing slash
    host = host.chomp('/')
    
    # Manually construct the URL
    "#{host}/api/calls/webhook.xml?call_id=#{call.id}"
  end
  
  # Generate status callback URL - manually construct the URL to avoid port issues
  def status_callback_url(call)
    # Get clean host without any port number
    host = ENV['APP_HOST'].to_s.strip
    Rails.logger.info "Host for status callback: #{host}"
    
    # Ensure the host doesn't already have https:// prefix
    unless host.start_with?('http://') || host.start_with?('https://')
      host = "https://#{host}"
    end
    
    # Ensure no trailing slash
    host = host.chomp('/')
    
    # Manually construct the URL
    "#{host}/api/calls/status_callback?call_id=#{call.id}"
  end
end
