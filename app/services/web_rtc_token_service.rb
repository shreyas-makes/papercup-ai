require 'jwt'

# Service to generate secure, time-limited JWT tokens for WebRTC clients
class WebRtcTokenService
  HMAC_SECRET = Rails.application.config.jwt_secret
  ALGORITHM = 'HS256'.freeze
  EXPIRATION_TIME = 3600 # 1 hour in seconds

  # Generates a JWT token for a given user
  #
  # @param user [User] The user for whom the token is generated
  # @return [String] The generated JWT token
  def self.generate_token(user)
    payload = {
      user_id: user.id,
      exp: Time.now.to_i + EXPIRATION_TIME,
      # Include any other relevant user data or permissions here
      # Example: name: user.name
    }
    JWT.encode(payload, HMAC_SECRET, ALGORITHM)
  end

  # Decodes a JWT token
  #
  # @param token [String] The JWT token to decode
  # @return [Hash, nil] The decoded payload if valid, nil otherwise
  def self.decode_token(token)
    begin
      decoded = JWT.decode(token, HMAC_SECRET, true, { algorithm: ALGORITHM })
      decoded[0] # Return the payload hash
    rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
      nil # Return nil if token is invalid or expired
    end
  end
end 