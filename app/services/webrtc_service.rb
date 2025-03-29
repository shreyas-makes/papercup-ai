# app/services/webrtc_service.rb
class WebrtcService
  def self.generate_configuration
    {
      ice_servers: generate_ice_servers,
      ice_transport_policy: 'all'  # Using 'all' since we're not requiring TURN
    }
  end
  
  def self.generate_ice_servers
    stun_servers = Rails.application.config.webrtc[:stun_servers]
    
    stun_servers.map do |url|
      { urls: url }
    end
  end
  
  # This method generates a short-lived JWT token for WebRTC authentication
  # Tokens are not needed for basic STUN usage but will be important
  # when we add more sophisticated WebRTC features in the future
  def self.generate_token(user_id, expires_in: 1.hour)
    payload = {
      sub: user_id.to_s,
      exp: Time.now.to_i + expires_in.to_i,
      webrtc_config: generate_configuration
    }
    
    JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
  end
end 