module Users
  class OmniauthCallbacksController < Devise::OmniauthCallbacksController
    # Google OAuth2 callback
    def google_oauth2
      handle_auth("Google")
    end
    
    # Handle OAuth failures
    def failure
      redirect_to root_path, alert: 'Authentication failed.'
    end

    private

    def handle_auth(kind)
      @user = User.from_omniauth(auth)
      if @user.persisted?
        flash[:notice] = I18n.t 'devise.omniauth_callbacks.success', kind: kind
        sign_in_and_redirect @user, event: :authentication
      else
        session['devise.auth_data'] = auth.except('extra')
        redirect_to new_user_registration_url, alert: @user.errors.full_messages.join("\n")
      end
    end

    def auth
      @auth ||= request.env['omniauth.auth']
    end
  end
end 