module Api
  class CallsController < Api::BaseController
    before_action :authenticate_user!, except: [:status_callback, :webhook, :twilio_status]
    before_action :verify_twilio_request, only: [:status_callback, :webhook]
    before_action :find_call, only: [:show, :update, :terminate]
    
    # GET /api/calls
    def index
      Rails.logger.info "====== CALL HISTORY REQUEST ======"
      Rails.logger.info "User: #{current_user.inspect}"
      
      @calls = current_user.calls.recent.limit(50)
      Rails.logger.info "Found #{@calls.count} calls for user"
      
      # Debug call data
      @calls.each do |call|
        Rails.logger.info "Call ID: #{call.id}, Phone: #{call.phone_number}, Status: #{call.status}, Created: #{call.created_at}"
      end
      
      render json: @calls
    end
    
    # GET /api/calls/:id
    def show
      render json: @call
    end
    
    # POST /api/calls
    def create
      Rails.logger.info "====== CREATING NEW CALL ======"
      Rails.logger.info "User: #{current_user.inspect}"
      Rails.logger.info "Params: #{call_params.inspect}"
      
      @call = current_user.calls.new(call_params)
      @call.status = 'initiated' # Set default status
      
      if @call.save
        Rails.logger.info "Call record created: #{@call.inspect}"
        
        service = CallService.new(@call)
        result = service.initiate
        
        if result[:success]
          Rails.logger.info "Call initiation successful"
          render json: @call, status: :created
        else
          Rails.logger.error "Call initiation failed: #{result[:error]}"
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      else
        Rails.logger.error "Call record creation failed: #{@call.errors.full_messages.join(', ')}"
        render json: { error: @call.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end
    
    # PATCH /api/calls/:id
    def update
      if @call.update(call_params)
        render json: @call
      else
        render json: { error: @call.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end
    
    # POST /api/calls/:id/terminate
    def terminate
      service = CallService.new(@call)
      result = service.terminate
      
      if result[:success]
        render json: @call
      else
        render json: { error: result[:error] }, status: :unprocessable_entity
      end
    end
    
    # POST /api/calls/status_callback
    # Webhook for Twilio call status updates
    def status_callback
      Rails.logger.info "============ TWILIO CALLBACK RECEIVED ============"
      Rails.logger.info "Params: #{params.inspect}"
      Rails.logger.info "Raw request: #{request.raw_post}"
      
      # Get parameters from the request
      call_id = params[:call_id]
      twilio_sid = params[:CallSid]
      status = params[:CallStatus]
      duration = params[:CallDuration]
      
      Rails.logger.info "Looking for call with: call_id=#{call_id.inspect}, twilio_sid=#{twilio_sid.inspect}"
      
      # Try to find the call by call_id first (our ID)
      call = if call_id.present?
               Call.find_by(id: call_id)
             end
             
      # If not found by call_id, try to find by twilio_sid
      if call.nil? && twilio_sid.present?
        call = Call.find_by(twilio_sid: twilio_sid)
      end
      
      # Log whether we found the call
      if call
        Rails.logger.info "FOUND CALL: #{call.id}, current status: #{call.status}"
        
        # Map Twilio status to our internal status if needed
        mapped_status = case status
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
        
        Rails.logger.info "Mapped Twilio status '#{status}' to internal status '#{mapped_status}'"
        
        # Update the call status in the database DIRECTLY first for immediate polling response
        if ['completed', 'terminated', 'failed'].include?(mapped_status)
          call.update(
            status: mapped_status == 'terminated' ? 'terminated' : 'completed',
            end_time: Time.current,
            duration_seconds: duration.to_i
          )
          Rails.logger.info "Updated call record directly: status=#{mapped_status}, duration=#{duration}"
        end
        
        # Then queue the background job for more processing
        UpdateCallStatusJob.perform_later(call.id, status, duration)
        Rails.logger.info "Queued UpdateCallStatusJob for call #{call.id}"
        
        head :ok
      else
        Rails.logger.error "CALL NOT FOUND: call_id=#{call_id}, twilio_sid=#{twilio_sid}"
        head :not_found
      end
    rescue => e
      Rails.logger.error "Error in status_callback: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      # Return 200 OK even on error to prevent Twilio from retrying
      head :ok
    end
    
    # POST/GET /api/calls/webhook
    # TwiML response for call handling
    def webhook
      call_id = params[:call_id]
      call = Call.find_by(id: call_id)
      
      response = Twilio::TwiML::VoiceResponse.new do |r|
        if call
          r.say(message: "Thank you for accepting this call from Papercup.")
          r.pause(length: 1)
          r.say(message: "This call will be charged at our standard rates.")
          r.pause(length: 1)
          
          # Example of playing hold music
          # r.play(url: 'https://demo.twilio.com/docs/classic.mp3')
          # r.say(message: "Please stay on the line.")
        else
          r.say(message: "Sorry, there was an error with this call.")
          r.hangup
        end
      end
      
      render xml: response.to_s
    end
    
    # GET /api/calls/twilio_status?sid=XXXXX
    # Direct check of Twilio status (fallback for webhook failures)
    def twilio_status
      Rails.logger.info "====== CHECKING TWILIO STATUS DIRECTLY ======"
      Rails.logger.info "Params: #{params.inspect}"
      
      # Get the Twilio SID from parameters
      twilio_sid = params[:sid]
      
      unless twilio_sid.present?
        return render json: { error: "Twilio SID required" }, status: :bad_request
      end
      
      # Find the call in our database
      call = Call.find_by(twilio_sid: twilio_sid)
      
      # Initialize Twilio client
      begin
        twilio_client = Twilio::REST::Client.new(
          ENV['TWILIO_ACCOUNT_SID'], 
          ENV['TWILIO_AUTH_TOKEN']
        )
        
        # Get call status directly from Twilio
        twilio_call = twilio_client.calls(twilio_sid).fetch
        Rails.logger.info "Twilio call status for SID #{twilio_sid}: #{twilio_call.status}"
        
        # Record actual Twilio state in our database if the call exists
        if call && ['completed', 'failed', 'canceled', 'busy', 'no-answer'].include?(twilio_call.status)
          # Update call record in our database if the status changed
          if call.status != 'completed' && call.status != 'terminated'
            Rails.logger.info "Updating call #{call.id} status to 'terminated' based on Twilio status '#{twilio_call.status}'"
            
            call.update(
              status: 'terminated',
              end_time: Time.current,
              duration_seconds: twilio_call.duration.to_i
            )
            
            # Schedule billing job
            CallBillingJob.perform_later(call.id)
          end
        end
        
        # Return the Twilio status along with our internal call data if available
        render json: {
          twilio_sid: twilio_sid,
          status: twilio_call.status,
          duration: twilio_call.duration,
          internal_call: call ? {
            id: call.id,
            status: call.status,
            duration: call.duration_seconds
          } : nil
        }
      rescue => e
        Rails.logger.error "Error checking Twilio status: #{e.class} - #{e.message}"
        render json: { error: "Failed to check Twilio status: #{e.message}" }, status: :internal_server_error
      end
    end
    
    private
    
    def verify_twilio_request
      return head :unauthorized unless valid_twilio_request?
    end
    
    def valid_twilio_request?
      validator = Twilio::Security::RequestValidator.new(ENV['TWILIO_AUTH_TOKEN'])
      twilio_signature = request.headers['X-Twilio-Signature']
      
      return false if twilio_signature.blank?
      
      # Construct the full URL including the protocol and host
      url = "#{request.protocol}#{request.host_with_port}#{request.fullpath}"
      
      # For POST requests, validate with params. For GET requests, validate without params
      if request.post?
        validator.validate(url, request.POST, twilio_signature)
      else
        validator.validate(url, {}, twilio_signature)
      end
    rescue => e
      Rails.logger.error "Twilio validation error: #{e.message}"
      false
    end
    
    def call_params
      params.require(:call).permit(:phone_number, :description, :scheduled_time)
    end
    
    def find_call
      @call = current_user.calls.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Call not found' }, status: :not_found
    end
    
    def authenticate_user!
      # Skip authentication in development when using ngrok for testing
      if Rails.env.development? && request.host.include?('ngrok-free.app')
        # Find a test user to use
        @current_user = User.first
        return true
      end
      
      super
    end
  end
end
