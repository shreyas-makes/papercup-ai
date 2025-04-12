module Api
  class CallMetricsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_call
    skip_before_action :verify_authenticity_token, only: [:create]
    
    # POST /api/calls/:call_id/metrics
    def create
      # Ensure user has permission to report metrics for this call
      unless @call.user == current_user
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end
      
      # Track the metrics
      result = CallQualityService.track_metrics(@call.id, metrics_params)
      
      if result
        render json: { success: true }, status: :created
      else
        render json: { error: "Failed to record metrics" }, status: :unprocessable_entity
      end
    end
    
    private
    
    def set_call
      @call = Call.find_by(id: params[:call_id])
      
      unless @call
        render json: { error: "Call not found" }, status: :not_found
      end
    end
    
    def metrics_params
      params.require(:metrics).permit(
        :jitter, 
        :packet_loss, 
        :latency, 
        :bitrate, 
        :codec, 
        :resolution,
        raw_data: {}
      )
    end
  end
end 