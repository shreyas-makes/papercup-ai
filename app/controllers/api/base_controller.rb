module Api
  class BaseController < ApplicationController
    skip_forgery_protection
    before_action :authenticate_user_from_token!
    
    private
    
    # Authenticate user from JWT token in header or params
    def authenticate_user_from_token!
      # No special case for test environment - force everything to use JWT
      token = extract_token_from_request
      payload = JwtService.decode(token) if token
      
      if payload && payload["user_id"]
        user = User.find_by(id: payload["user_id"])
        if user
          sign_in user, store: false
        else
          render json: { error: 'User not found' }, status: :unauthorized
        end
      else
        render json: { error: 'Unauthorized' }, status: :unauthorized unless user_signed_in?
      end
    end
    
    # Extract token from Authorization header or params
    def extract_token_from_request
      auth_header = request.headers['Authorization']
      if auth_header&.start_with?('Bearer ')
        return auth_header.split(' ').last
      end
      
      params[:token]
    end
  end
end 