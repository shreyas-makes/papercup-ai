RSpec.configure do |config|
  # OmniAuth configurations for testing
  OmniAuth.config.test_mode = true
  
  # Configure the OmniAuth mock for Google OAuth2
  OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
    provider: 'google_oauth2',
    uid: '123456789',
    info: {
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://lh3.googleusercontent.com/test/photo.jpg'
    },
    credentials: {
      token: 'mock_token',
      expires_at: Time.now.to_i + 3600
    }
  })
  
  # Configure OmniAuth to use test mode for feature specs
  config.before(:each, type: :feature) do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: 'google_oauth2',
      uid: '123456789',
      info: {
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://lh3.googleusercontent.com/test/photo.jpg'
      },
      credentials: {
        token: 'mock_token',
        expires_at: Time.now.to_i + 3600
      }
    })
  end
  
  # Handle OmniAuth failures in test
  OmniAuth.config.on_failure = proc { |env|
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
  }

  # Set allowed request methods - make POST allowed since that's what Devise expects
  OmniAuth.config.allowed_request_methods = [:post, :get]

  # Don't manually set path_prefix - let Devise handle that
  # OmniAuth.config.path_prefix = "/users/auth"
end 