module TokenAuthenticatable
  extend ActiveSupport::Concern

  # Authenticate user with JWT token
  def authenticate_token!
    return authenticate_user! unless token_present?
    
    authenticate_with_token
  end

  private

  def token_present?
    request.headers['Authorization'].present?
  end

  def authenticate_with_token
    payload = decode_auth_token
    
    if payload && user = User.find_by(id: payload['user_id'])
      # Set the current_user for this request
      sign_in(user, store: false)
    else
      render json: { error: 'Invalid token' }, status: :unauthorized
    end
  rescue JWT::DecodeError
    render json: { error: 'Invalid token' }, status: :unauthorized
  end

  def decode_auth_token
    token = request.headers['Authorization'].to_s.split(' ').last
    JwtService.decode(token)
  end
end
