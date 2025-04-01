module Users
  class OmniauthCallbacksController < Devise::OmniauthCallbacksController
    # Google OAuth2 callback
    def google_oauth2
      # Get user from omniauth data
      @user = User.from_omniauth(request.env["omniauth.auth"])
      
      if @user.persisted?
        # Generate JWT token for API access
        token = JwtService.encode(@user)
        
        # Store token in cookies for later use
        cookies.signed[:jwt] = {
          value: token,
          httponly: true,
          expires: 2.hours.from_now,
          secure: Rails.env.production?
        }
        
        # Sign in the user
        sign_in_and_redirect @user, event: :authentication
        set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
      else
        # Save oauth data to session for use during registration
        session["devise.google_data"] = request.env["omniauth.auth"].except("extra")
        redirect_to new_user_registration_url
      end
    end
    
    # Handle OAuth failures
    def failure
      redirect_to root_path, alert: "Authentication failed. Please try again."
    end
  end
end 