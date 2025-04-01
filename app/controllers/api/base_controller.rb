module Api
  class BaseController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :authenticate_user_from_token!
    
    private
    
    # Authenticate user from JWT token in header or params
    def authenticate_user_from_token!
      token = extract_token_from_request
      user = JwtService.decode(token) if token
      
      if user
        sign_in user, store: false
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