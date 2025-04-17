module Api
  class BaseController < ApplicationController
    protect_from_forgery with: :null_session
    skip_before_action :verify_authenticity_token
    
    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ActionController::ParameterMissing, with: :bad_request
    rescue_from StandardError, with: :server_error

    respond_to :json

    private
    
    protected

    def authenticate_user!
      Rails.logger.info "====== API AUTHENTICATION CHECK (Session) ======"
      Rails.logger.info "Current user before auth: #{current_user.inspect}"
      
      unless user_signed_in?
        Rails.logger.info "No user signed in via session, returning 401"
        respond_with_error('You need to sign in or sign up before continuing.', :unauthorized)
      end
    end

    def current_user
      super
    end

    def respond_with_error(message, status)
      render json: { error: message }, status: status
    end

    def not_found
      respond_with_error('Resource not found', :not_found)
    end

    def bad_request(exception)
      respond_with_error(exception.message, :bad_request)
    end

    def server_error(exception)
      Rails.logger.error "API Error: #{exception.message}"
      Rails.logger.error exception.backtrace.join("\n")
      respond_with_error('Something went wrong', :internal_server_error)
    end
  end
end