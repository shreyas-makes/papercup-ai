module Users
  class OmniauthCallbacksController < Devise::OmniauthCallbacksController
    skip_before_action :verify_authenticity_token, only: [:google_oauth2]
    before_action :ensure_not_already_authenticated, only: [:passthru]

    # Google OAuth2 callback
    def google_oauth2
      auth = request.env["omniauth.auth"]
      Rails.logger.info "Google OAuth2 data: #{auth.to_h}"
      @user = User.from_omniauth(auth)

      if @user.persisted?
        flash[:notice] = I18n.t "devise.omniauth_callbacks.success", kind: "Google"
        sign_in_and_redirect @user, event: :authentication
      else
        session["devise.google_data"] = request.env["omniauth.auth"].to_h
        redirect_to new_user_registration_url, alert: @user.errors.full_messages.join("\n")
      end
    end
    
    def passthru
      # This action is called before sending the request to the provider
      render status: 404, plain: "Not found. Authentication passthru."
    end

    # Handle OAuth failures
    def failure
      redirect_to root_path, alert: "Authentication failed: #{params[:message]}"
    end

    private

    def ensure_not_already_authenticated
      # If user is trying to use OAuth from signup page, force logout first
      if user_signed_in? && (request.referer&.include?('signup') || params[:force_new_account])
        sign_out current_user
      end
    end

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