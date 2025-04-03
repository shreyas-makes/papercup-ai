# WebRTC configuration for Papercup
# Currently using only public STUN servers for NAT traversal
# TURN servers will be added in the future if needed for complex network scenarios

Papercup::Application.config.webrtc = {
  # Use Google's public STUN server by default
  stun_servers: [
    ENV.fetch('STUN_SERVER_URL', 'stun:stun.l.google.com:19302'),
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302'
  ],
  # Add TURN server configuration here later if needed
  # turn_servers: [
  #   {
  #     urls: ENV.fetch('TURN_SERVER_URL'),
  #     username: ENV.fetch('TURN_USERNAME'),
  #     credential: ENV.fetch('TURN_PASSWORD')
  #   }
  # ]
}

# Ensure JWT secret is configured
Rails.application.config.jwt_secret = ENV.fetch('JWT_SECRET_KEY_BASE') do
  if Rails.env.production?
    raise "JWT_SECRET_KEY_BASE environment variable must be set in production"
  else
    # Use a default secret for development/test, but ideally generate one
    # with `rake secret` and store it securely (e.g., Rails credentials)
    'dev_secret_key_base_placeholder_replace_me_please_1234567890abcdef'
  end
end 