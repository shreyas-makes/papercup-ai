# Service for handling JSON Web Tokens (JWT) for authentication
class JwtService
  ALGORITHM = 'HS256'
  
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
end 