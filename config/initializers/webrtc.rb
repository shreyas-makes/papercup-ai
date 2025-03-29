# WebRTC configuration for Papercup
# Currently using only public STUN servers for NAT traversal
# TURN servers will be added in the future if needed for complex network scenarios

Papercup::Application.config.webrtc = {
  # Use Google's public STUN server by default
  stun_servers: [
    ENV.fetch('STUN_SERVER_URL', 'stun:stun.l.google.com:19302'),
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302'
  ]
} 