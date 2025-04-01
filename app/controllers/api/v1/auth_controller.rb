module Api
  module V1
    class AuthController < ApplicationController
      include JwtAuthenticatable
      skip_before_action :authenticate_jwt!, only: [:create]
      
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