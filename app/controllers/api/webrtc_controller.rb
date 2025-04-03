class Api::WebrtcController < ApplicationController
  # Assuming you have Devise or similar for authentication
  before_action :authenticate_user! # Ensure user is logged in

  # POST /api/webrtc/token
  def token
    token = WebRtcTokenService.generate_token(current_user)
    ice_servers = Rails.application.config.webrtc[:stun_servers]
    # Include TURN servers if configured:
    # ice_servers += Rails.application.config.webrtc[:turn_servers] if Rails.application.config.webrtc[:turn_servers]

    render json: {
      token: token,
      iceServers: ice_servers.map { |url| { urls: url } } # Format for WebRTC
      # If using TURN with credentials:
      # iceServers: Rails.application.config.webrtc[:stun_servers].map { |url| { urls: url } } +
      #             (Rails.application.config.webrtc[:turn_servers] || []).map { |server| { urls: server[:urls], username: server[:username], credential: server[:credential] } }
    }, status: :ok
  rescue => e
    # Log the error appropriately
    Rails.logger.error "Error generating WebRTC token for user #{current_user&.id}: #{e.message}"
    render json: { error: 'Failed to generate token' }, status: :internal_server_error
  end
end
