# Controller for handling user sessions
class SessionsController < ApplicationController
  before_action :authenticate_user!, only: [:destroy]
  
  # GET /session/token
  # Generate a JWT token for the current user
  def token
    if user_signed_in?
      token = JwtService.encode(current_user)
      render json: { token: token }, status: :ok
    else
      render json: { error: 'Not authenticated' }, status: :unauthorized
    end
  end
  
  # DELETE /session
  # Destroy the current session (logout)
  def destroy
    sign_out current_user
    redirect_to root_path, notice: 'You have been signed out successfully.'
  end
end 