module OmniAuthHelpers
  def mock_google_oauth2
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: 'google_oauth2',
      uid: '123456',
      info: {
        email: 'test@example.com',
        name: 'Test User'
      },
      credentials: {
        token: 'mock_token',
        expires_at: 1.week.from_now.to_i
      }
    })
  end

  def mock_google_oauth2_failure
    OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
  end
end

RSpec.configure do |config|
  config.include OmniAuthHelpers, type: :request
end
