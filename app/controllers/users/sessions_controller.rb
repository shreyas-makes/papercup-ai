class Users::SessionsController < Devise::SessionsController
  # before_action :configure_sign_in_params, only: [:create]
  respond_to :html, :json

  # GET /resource/sign_in
  # def new
  #   super
  # end

  # POST /resource/sign_in
  def create
    self.resource = warden.authenticate!(auth_options)
    
    sign_in(resource_name, resource)
    
    respond_to do |format|
      format.html { redirect_to after_sign_in_path_for(resource) }
      format.json { 
        render json: {
          status: 'success',
          user: {
            id: current_user.id,
            email: current_user.email
          },
          credits: current_user.credit_balance
        }
      }
    end
  end

  # DELETE /resource/sign_out
  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    
    respond_to do |format|
      format.html { redirect_to after_sign_out_path_for(resource_name) }
      format.json { render json: { status: 'success' } }
    end
  end

  # Protected methods
  protected

  # The path used after sign in
  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_index_path
  end
  
  # The path used after sign out
  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_in_params
  #   devise_parameter_sanitizer.permit(:sign_in, keys: [:attribute])
  # end
end 