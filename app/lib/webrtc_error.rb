class WebRtcError < StandardError
  attr_reader :connection_state, :ice_state, :signal_state, :error_type

  def initialize(message = "WebRTC connection error", error_type = :connection, metadata = {})
    @error_type = error_type
    @connection_state = metadata[:connection_state]
    @ice_state = metadata[:ice_state]
    @signal_state = metadata[:signal_state]
    
    # Store states in thread variables for Sentry context
    Thread.current[:webrtc_connection_state] = @connection_state
    Thread.current[:webrtc_ice_gathering_state] = @ice_state
    Thread.current[:webrtc_signaling_state] = @signal_state
    
    super(message)
  end
  
  # Different types of WebRTC errors
  def self.connection_failed(metadata = {})
    new("WebRTC connection failed", :connection_failed, metadata)
  end
  
  def self.media_error(metadata = {})
    new("WebRTC media access error", :media_error, metadata)
  end
  
  def self.ice_failure(metadata = {})
    new("WebRTC ICE connection failure", :ice_failure, metadata)
  end
  
  def self.signaling_error(metadata = {})
    new("WebRTC signaling error", :signaling_error, metadata)
  end
  
  def self.call_setup_failure(metadata = {})
    new("WebRTC call setup failure", :call_setup_failure, metadata)
  end
end 