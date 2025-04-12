module Api
  module V1
    class AuthController < Api::BaseController
      include JwtAuthenticatable
      skip_before_action :authenticate_user_from_token!, only: [:create, :login_from_session]
      
      def create
        user = User.find_by(email: params[:email])
        if user&.valid_password?(params[:password])
          render json: {
            token: user.jwt_token,
            user: {
              id: user.id,
              email: user.email,
              credit_balance: user.credit_balance
            }
          }
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # Add method to create a JWT token for already authenticated users
      def login_from_session
        if user_signed_in?
          render json: {
            token: current_user.jwt_token,
            user: {
              id: current_user.id,
              email: current_user.email,
              credit_balance: current_user.credit_balance
            }
          }
        else
          render json: { error: 'Not authenticated' }, status: :unauthorized
        end
      end

      def me
        render json: {
          user: {
            id: current_user.id,
            email: current_user.email,
            credit_balance: current_user.credit_balance
          }
        }
      end

      def destroy
        sign_out current_user
        render json: { message: 'Successfully logged out' }
      end
    end
  end
end 