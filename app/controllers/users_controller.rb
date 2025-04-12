class UsersController < ApplicationController
  before_action :authenticate_user!
  
  # GET /users/analytics
  def analytics
    @stats = {
      total_calls: current_user.calls.count,
      recent_calls: current_user.calls.recent.count,
      total_duration: current_user.calls.sum(:duration),
      average_quality: average_call_quality
    }
    
    render :analytics
  end
  
  private
  
  def average_call_quality
    # Calculate average quality score for user's calls
    calls = current_user.calls.completed
    
    return "Unknown" if calls.empty?
    
    # Get all call metrics for these calls
    call_ids = calls.pluck(:id)
    metrics = CallMetric.where(call_id: call_ids)
    
    return "Unknown" if metrics.empty?
    
    # Calculate average jitter, packet loss, and latency
    avg_jitter = metrics.average(:jitter).to_f
    avg_packet_loss = metrics.average(:packet_loss).to_f
    avg_latency = metrics.average(:latency).to_f
    
    # Calculate and return quality score
    score = CallQualityService.calculate_quality_score(avg_jitter, avg_packet_loss, avg_latency)
    CallQualityService.rate_quality(score)
  end
end 