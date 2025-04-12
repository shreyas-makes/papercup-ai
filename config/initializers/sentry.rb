Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  
  # Set the environment
  config.environment = Rails.env
  
  # Enable performance monitoring
  config.enable_tracing = true
  
  # Set traces sample rate to capture performance data
  # Adjust the value between 0.0-1.0 based on traffic volume
  config.traces_sample_rate = 0.2
  
  # Send the user information in error reports
  config.send_default_pii = true
  
  # Exclude certain errors from being reported
  config.excluded_exceptions += [
    'ActionController::RoutingError',
    'ActiveRecord::RecordNotFound'
  ]
  
  # Only run in production and staging environments
  config.enabled_environments = %w[production staging]
  
  # Add WebRTC-specific context
  config.before_send = lambda do |event, hint|
    # If the error comes from WebRTC components, add additional context
    if hint[:exception].is_a?(WebRtcError) || 
       (hint[:exception].message =~ /webrtc|media|connection/i)
      event.contexts[:webrtc] = {
        connection_state: Thread.current[:webrtc_connection_state],
        ice_gathering_state: Thread.current[:webrtc_ice_gathering_state],
        signaling_state: Thread.current[:webrtc_signaling_state]
      }
    end
    
    event
  end
  
  # Set performance thresholds
  config.traces_sampler = lambda do |sampling_context|
    transaction_context = sampling_context[:transaction_context]
    transaction_name = transaction_context[:name]
    
    # Sample WebRTC-related transactions at a higher rate
    if transaction_name =~ /webrtc|call/i
      0.5
    else
      0.2
    end
  end
end

# Helper method to set user context in controllers
module SentryUserContext
  def self.set_user(user)
    if user
      Sentry.set_user({
        id: user.id,
        email: user.email,
        credit_balance: user.credit_balance_cents,
        subscription_status: user.subscription_status
      })
    else
      Sentry.set_user({})
    end
  end
end 