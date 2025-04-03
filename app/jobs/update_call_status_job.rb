class UpdateCallStatusJob < ApplicationJob
  queue_as :calls
  
  # This job updates the call status based on Twilio callbacks
  def perform(call_id, status, duration = nil)
    call = Call.find_by(id: call_id)
    return unless call
    
    service = CallService.new(call)
    
    # Map Twilio status to our internal status
    mapped_status = case status
                    when 'initiated', 'ringing'
                      'ringing'
                    when 'in-progress', 'answered'
                      'in_progress'
                    when 'completed'
                      'completed'
                    when 'busy'
                      'failed'
                    when 'no-answer'
                      'failed'
                    when 'canceled'
                      'terminated'
                    when 'failed'
                      'failed'
                    else
                      status
                    end
    
    # Update the call status
    result = service.update_status(mapped_status, duration)
    
    # If call failed, log the reason
    if mapped_status == 'failed' && !call.failure_reason.present?
      call.update(failure_reason: 'call_failed')
    end
    
    # If call completed or terminated, schedule billing
    if ['completed', 'terminated'].include?(mapped_status)
      CallBillingJob.perform_later(call_id)
    end
  end
end
