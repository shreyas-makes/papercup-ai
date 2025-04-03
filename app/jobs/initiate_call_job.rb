class InitiateCallJob < ApplicationJob
  queue_as :calls
  
  # This job handles the initial setup of a call through Twilio
  # It will update the call status as it proceeds
  def perform(call_id)
    call = Call.find_by(id: call_id)
    return unless call
    
    service = CallService.new(call)
    
    begin
      # Initialize Twilio client
      twilio_client = Twilio::REST::Client.new
      
      # Make the call through Twilio
      twilio_call = twilio_client.calls.create(
        url: Rails.application.routes.url_helpers.api_calls_webhook_url(format: 'xml', call_id: call.id),
        to: call.phone_number,
        from: Rails.application.credentials.twilio[:phone_number],
        status_callback: Rails.application.routes.url_helpers.api_calls_status_callback_url(format: 'json', call_id: call.id),
        status_callback_event: ['initiated', 'ringing', 'answered', 'completed'],
        status_callback_method: 'POST'
      )
      
      # Store the Twilio SID for future reference
      call.update(twilio_sid: twilio_call.sid, status: 'ringing')
      
      # Create an event for the ringing status
      CallEvent.create!(
        call: call,
        event_type: 'ringing',
        occurred_at: Time.current
      )
      
    rescue Twilio::REST::RestError => e
      # Handle Twilio errors
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
      # Handle other errors
      call.update(status: 'failed', failure_reason: 'system_error')
      
      CallEvent.create!(
        call: call,
        event_type: 'failed',
        occurred_at: Time.current,
        metadata: { error: e.message }
      )
    end
  end
end
