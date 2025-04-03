class CallHangupJob < ApplicationJob
  queue_as :calls
  
  # This job handles hanging up active calls (e.g., when user runs out of credits)
  def perform(call_id, reason = nil)
    call = Call.find_by(id: call_id)
    return unless call
    
    # Only process calls that are in progress
    return unless call.status == 'in_progress' || call.status == 'ringing'
    
    service = CallService.new(call)
    
    begin
      # Terminate the call
      result = service.terminate
      
      # Update the call record with reason if provided
      if reason.present?
        call.update(failure_reason: reason)
      end
      
      # Create a hangup event
      CallEvent.create!(
        call: call,
        event_type: 'terminated',
        occurred_at: Time.current,
        metadata: { 
          reason: reason || 'user_requested',
          initiated_by: 'system'
        }
      )
      
    rescue => e
      # Log error but don't fail
      Rails.logger.error "Error hanging up call #{call_id}: #{e.message}"
      
      CallEvent.create!(
        call: call,
        event_type: 'hangup_failed',
        occurred_at: Time.current,
        metadata: { error: e.message }
      )
    end
  end
end
