module Admin
  class AnalyticsController < ApplicationController
    before_action :authenticate_user!
    before_action :check_admin
    
    # GET /admin/analytics
    def index
      @stats = {
        total_calls: Call.count,
        total_users: User.count,
        calls_today: Call.where('created_at >= ?', Date.today).count,
        active_users: User.where('last_sign_in_at >= ?', 30.days.ago).count
      }
    end
    
    # GET /admin/analytics/call_volume
    def call_volume
      # Call volume over time
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      
      @volume_data = Call.in_timeframe(start_date, end_date)
        .group("DATE(created_at)")
        .count
        
      @volume_by_status = Call.in_timeframe(start_date, end_date)
        .group("DATE(created_at)")
        .group(:status)
        .count
        
      respond_to do |format|
        format.html
        format.json { render json: { volume: @volume_data, by_status: @volume_by_status } }
      end
    end
    
    # GET /admin/analytics/call_quality
    def call_quality
      # Call quality metrics
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      
      # Get aggregate metrics
      @metrics = CallQualityService.aggregate_metrics(start_date, end_date)
      
      # Get quality metrics over time
      @daily_metrics = []
      (start_date..end_date).each do |date|
        daily_data = CallQualityService.aggregate_metrics(date, date)
        @daily_metrics << { date: date, metrics: daily_data }
      end
      
      respond_to do |format|
        format.html
        format.json { render json: { aggregate: @metrics, daily: @daily_metrics } }
      end
    end
    
    # GET /admin/analytics/revenue
    def revenue
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
      
      # This is a placeholder - implement based on your actual data model
      @revenue_data = Call.in_timeframe(start_date, end_date)
        .joins(:user)
        .group("DATE(calls.created_at)")
        .sum(:cost_cents) # Assuming you use Money-Rails and have a cost_cents field
        
      # Revenue by country
      @revenue_by_country = Call.in_timeframe(start_date, end_date)
        .group(:country_code)
        .sum(:cost_cents)
        
      respond_to do |format|
        format.html
        format.json { render json: { daily: @revenue_data, by_country: @revenue_by_country } }
      end
    end
    
    # GET /admin/analytics/destinations
    def destinations
      # Top destinations
      @destinations = Call.group(:country_code)
        .select("country_code, COUNT(*) as call_count, SUM(duration) as total_duration")
        .order("call_count DESC")
        .limit(20)
        
      respond_to do |format|
        format.html
        format.json { render json: @destinations }
      end
    end
    
    # GET /admin/analytics/users
    def users
      # User statistics
      @user_stats = {
        total: User.count,
        active: User.where('last_sign_in_at >= ?', 30.days.ago).count,
        new_today: User.where('created_at >= ?', Date.today).count,
        new_this_week: User.where('created_at >= ?', 1.week.ago).count,
        new_this_month: User.where('created_at >= ?', 1.month.ago).count
      }
      
      # New users over time
      @new_users = User.where('created_at >= ?', 3.months.ago)
        .group("DATE(created_at)")
        .count
        
      respond_to do |format|
        format.html
        format.json { render json: { stats: @user_stats, new_users: @new_users } }
      end
    end
    
    private
    
    def check_admin
      unless current_user.admin?
        redirect_to root_path, alert: "You don't have permission to access this page"
      end
    end
  end
end 