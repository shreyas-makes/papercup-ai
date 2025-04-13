module Api
  class CallsController < Api::BaseController
    before_action :authenticate_user!, except: [:status_callback, :webhook]
    before_action :find_call, only: [:show, :update, :terminate]
    
    # GET /api/calls
    def index
      @calls = current_user.calls.recent.limit(50)
      render json: @calls
    end
    
    # GET /api/calls/:id
    def show
      render json: @call
    end
    
    # POST /api/calls
    def create
      @call = current_user.calls.new(call_params)
      @call.status = 'initiated' # Set default status
      
      if @call.save
        service = CallService.new(@call)
        result = service.initiate
        
        if result[:success]
          render json: @call, status: :created
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      else
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
      call_id = params[:call_id]
      status = params[:CallStatus]
      duration = params[:CallDuration]
      
      # Enqueue a job to update the call status
      UpdateCallStatusJob.perform_later(call_id, status, duration)
      
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
    
    private
    
    def find_call
      @call = current_user.calls.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Call not found' }, status: :not_found
    end
    
    def call_params
      params.require(:call).permit(:phone_number, :country_code, :status)
    end
  end
end
