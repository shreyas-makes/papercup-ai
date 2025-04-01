# Service for handling JSON Web Tokens (JWT) for authentication
class JwtService
  # Generate a JWT token for a user
  # @param user [User] the user to create a token for
  # @param expiry [Integer] token expiry time in seconds, defaults to 2 hours
  # @return [String] the generated JWT token
  def self.encode(user, expiry = 2.hours.to_i)
    payload = {
      user_id: user.id,
      exp: Time.current.to_i + expiry
    }
    
    JWT.encode(payload, jwt_secret)
  end
  
  # Decode a JWT token and return the user
  # @param token [String] the JWT token to decode
  # @return [User, nil] the user if token is valid, nil otherwise
  def self.decode(token)
    return nil if token.blank?
    
    begin
      decoded = JWT.decode(token, jwt_secret).first
      User.find_by(id: decoded["user_id"])
    rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError, ActiveRecord::RecordNotFound
      nil
    end
  end
  
  private
  
  # Get the secret key for JWT encoding/decoding
  # @return [String] the JWT secret key
  def self.jwt_secret
    Rails.application.credentials.secret_key_base
  end
end 