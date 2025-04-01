class SubscribeController < ApplicationController
  before_action :authenticate_user!
  before_action :maybe_skip_onboarding

  def index
    begin
      # Try to record A/B test completion if Redis is available
      if defined?(redis_connected?) && redis_connected?
        ab_finished(:cta, reset: false)
      end
    rescue => e
      # Log error but don't crash the page
      Rails.logger.error "A/B testing error: #{e.message}"
    end
    
    @packages = [
      { id: 'starter', name: 'Starter', price: 10, credits: 50, popular: false,
        features: ['Approximately 45 minutes of talk time', 'Valid for 30 days'] },
      { id: 'standard', name: 'Standard', price: 25, credits: 150, popular: true,
        features: ['Approximately 140 minutes of talk time', 'Valid for 60 days', 'Save 15% compared to Starter'] },
      { id: 'premium', name: 'Premium', price: 50, credits: 350, popular: false,
        features: ['Approximately 350 minutes of talk time', 'Valid for 90 days', 'Save 30% compared to Starter'] }
    ]
  end
  
  private
  
  def maybe_skip_onboarding
    # If the user already has credits, redirect to dashboard
    if current_user.respond_to?(:credits) && current_user.credits.to_f > 0
      redirect_to dashboard_path, notice: "You already have credits!"
    end
  end
  
  # Helper method to check if Redis is connected
  def redis_connected?
    begin
      Redis.current.ping == "PONG"
    rescue
      false
    end
  end
end
