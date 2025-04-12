module Api
  class AnalyticsController < ApplicationController
    before_action :authenticate_user!
    
    # GET /api/analytics
    def index
      # Basic summary stats for the user
      @stats = {
        total_calls: current_user.calls.count,
        recent_calls: current_user.calls.recent.count,
        total_duration: current_user.calls.sum(:duration),
        average_quality: average_call_quality
      }
      
      render json: @stats
    end
    
    # GET /api/analytics/call_volume
    def call_volume
      # Call volume over time (last 30 days by default)
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      
      # Group calls by day
      @volume_data = current_user.calls
        .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
        .group("DATE(created_at)")
        .count
      
      render json: @volume_data
    end
    
    # GET /api/analytics/call_quality
    def call_quality
      # Call quality metrics over time
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      
      # Get calls in timeframe
      calls = current_user.calls.in_timeframe(start_date, end_date)
      
      # Collect quality metrics from calls
      @quality_data = []
      calls.find_each do |call|
        quality_info = CallQualityService.analyze_call(call)
        @quality_data << {
          id: call.id,
          date: call.created_at,
          duration: call.duration,
          quality: quality_info[:quality],
          score: quality_info[:score],
          metrics: {
            jitter: quality_info[:jitter],
            packet_loss: quality_info[:packet_loss],
            latency: quality_info[:latency]
          }
        }
      end
      
      render json: @quality_data
    end
    
    # GET /api/analytics/destinations
    def destinations
      # Top called destinations
      @destinations = current_user.calls
        .group(:country_code)
        .select("country_code, COUNT(*) as call_count, SUM(duration) as total_duration")
        .order("call_count DESC")
        .limit(10)
      
      render json: @destinations
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
end 