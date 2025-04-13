class ApplicationController < ActionController::Base
  include Response
  include ExceptionHandler
  rescue_from ActiveRecord::RecordNotDestroyed, with: :not_destroyed
  
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

  def authenticate_request!
    return invalid_authentication if !payload || !JwtService.valid_payload(payload)
    current_user!
    invalid_authentication unless @current_user
  end
  
  def current_user!
    @current_user = User.find_by(id: payload['user_id'])
  end
  
  private
  
  def payload
    auth_header = request.headers['Authorization']
    return nil unless auth_header
    
    if auth_header.include?('Bearer ')
      token = auth_header.split(' ').last
      JwtService.decode(token)
    else
      nil
    end
  rescue StandardError
    nil
  end
  
  def invalid_authentication
    render json: { error: 'You will need to login first' }, status: :unauthorized
  end

  def not_destroyed(e)
    render json: { errors: e.record.errors }, status: :unprocessable_entity
  end

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
