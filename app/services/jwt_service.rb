# Service for handling JSON Web Tokens (JWT) for authentication
class JwtService
  ALGORITHM = 'HS256'
  
  def initialize(user = nil)
    @user = user
  end
  
  class << self
    # Generate a JWT token for a user
    # @param payload [Hash] the payload to encode (typically includes user_id)
    # @return [String] the generated JWT token
    def encode(payload)
      JWT.encode(
        payload.merge(exp: 24.hours.from_now.to_i),
        secret_key,
        ALGORITHM
      )
    end
    
    # Decode a JWT token and return the payload
    # @param token [String] the JWT token to decode
    # @return [Hash, nil] the decoded payload if token is valid, nil otherwise
    def decode(token)
      JWT.decode(token, secret_key, true, { algorithm: ALGORITHM }).first
    rescue JWT::DecodeError
      nil
    end

    private

    # Get the secret key for JWT encoding/decoding
    # @return [String] the JWT secret key
    def secret_key
      ENV['JWT_SECRET_KEY'] || Rails.application.secret_key_base
    end
  end
  
  # Generate a JWT token for WebRTC authentication
  def generate_webrtc_token
    payload = {
      user_id: @user&.id,
      exp: 1.hour.from_now.to_i,
      iat: Time.current.to_i,
      jti: SecureRandom.uuid
    }
    
    JWT.encode(payload, webrtc_secret_key, 'HS256')
  end
  
  # Verify a WebRTC token
  def verify_webrtc_token(token)
    begin
      decoded_token = JWT.decode(token, webrtc_secret_key, true, { algorithm: 'HS256' })
      return decoded_token[0]
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError => e
      Rails.logger.error("Token verification failed: #{e.message}")
      return nil
    end
  end
  
  private
  
  def webrtc_secret_key
    ENV['WEBRTC_SECRET_KEY'] || Rails.application.credentials.webrtc_secret_key || 'development_webrtc_secret'
  end
end 