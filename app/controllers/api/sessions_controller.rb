module Api
  class SessionsController < Api::BaseController
    skip_before_action :authenticate_user_from_token!, only: [:create]
    
    # POST /api/sessions
    # Creates a new session and returns a JWT token
    def create
      user = User.find_by(email: params[:email])
      
      if user&.valid_password?(params[:password])
        token = JwtService.encode(user)
        render json: { token: token, user: user_data(user) }, status: :created
      else
        render json: { error: 'Invalid email or password' }, status: :unauthorized
      end
    end
    
    # DELETE /api/sessions
    # Destroys the current session
    def destroy
      sign_out current_user if current_user
      render json: { message: 'Logged out successfully' }, status: :ok
    end
    
    # GET /api/sessions/check
    # Checks if the current user is authenticated
    def check
      render json: { authenticated: true, user: user_data(current_user) }, status: :ok
    end
    
    private
    
    # Returns serialized user data
    def user_data(user)
      {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credit_balance: user.credit_balance.format,
        credit_balance_cents: user.credit_balance_cents,
        admin: user.admin
      }
    end
  end
end 