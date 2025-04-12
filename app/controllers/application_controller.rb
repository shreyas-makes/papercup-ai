class ApplicationController < ActionController::Base
  impersonates :user
  protect_from_forgery with: :exception, unless: -> { request.format.json? }

  # uncomment to allow extra User model params during registration (beyond email/password)
  # before_action :configure_permitted_parameters, if: :devise_controller?

  around_action :measure_controller_performance

  def authenticate_admin!(alert_message: nil)
    redirect_to new_user_session_path, alert: alert_message unless current_user&.admin?
  end

  def after_sign_in_path_for(resource)
    credits_path # Always redirect to credits page for package selection
  end

  def maybe_skip_onboarding
    redirect_to dashboard_index_path, notice: "You're already subscribed" if current_user.finished_onboarding?
  end

  # whitelist extra User model params by uncommenting below and adding User attrs as keys
  # def configure_permitted_parameters
  #   devise_parameter_sanitizer.permit(:sign_up, keys: [:username])
  # end

  protected

  def measure_controller_performance
    # Skip for ActiveAdmin controllers
    if self.class.name.start_with?('ActiveAdmin::')
      yield
      return
    end
    
    PerformanceMonitoringService.measure_api_response_time(
      controller_name, action_name
    ) do
      yield
    end
  end

  # Add user context to Sentry
  def set_sentry_context
    if current_user
      SentryUserContext.set_user(current_user)
    end
  end
end
