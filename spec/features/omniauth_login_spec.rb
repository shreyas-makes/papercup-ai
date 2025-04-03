require 'rails_helper'

RSpec.feature "OmniAuth Login", type: :feature do
  before do
    OmniAuth.config.test_mode = true

    # Configure OmniAuth for feature specs
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

    # Skip Stripe customer creation to avoid API calls during tests
    allow_any_instance_of(User).to receive(:setup_stripe_customer).and_return(true)
    
    # In feature specs, we need to set up OmniAuth to short-circuit the external call
    # and directly redirect to the callback url
    OmniAuth.config.before_callback_phase do |env|
      # Skip the actual OAuth 2.0 authentication
      strategy = env['omniauth.strategy']
      if strategy.is_a?(OmniAuth::Strategies::OAuth2)
        strategy.options[:client_options][:authorize_url] = '/users/auth/google_oauth2/callback'
      end
    end
  end

  scenario "User can sign in with Google" do
    # Visit the login page
    visit '/login'
    
    # Verify we're on the login page
    expect(page).to have_content("Log in") # Assuming page has this text
    
    # This simulates clicking "Sign in with Google"
    # We're bypassing the actual click because in test mode OmniAuth
    # will directly redirect to the callback
    visit '/users/auth/google_oauth2/callback'
    
    # Should be redirected to the root path after successful authentication
    expect(current_path).to eq(root_path)
    
    # Should create a new user
    user = User.last
    expect(user.email).to eq('test@example.com')
    expect(user.name).to eq('Test User')
    expect(user.provider).to eq('google_oauth2')
    expect(user.uid).to eq('123456789')
  end
  
  scenario "Existing user can sign in with Google" do
    # Create a user with the same email and oauth details
    User.create!(
      email: 'test@example.com',
      password: 'password123',
      provider: 'google_oauth2',
      uid: '123456789',
      name: 'Test User'
    )
    
    # Visit the login page
    visit '/login'
    
    # Verify we're on the login page
    expect(page).to have_content("Log in") # Assuming page has this text
    
    # This simulates clicking "Sign in with Google"
    visit '/users/auth/google_oauth2/callback'
    
    # Should be redirected to the root path after successful authentication
    expect(current_path).to eq(root_path)
    
    # Should not create a new user
    expect(User.count).to eq(1)
  end
  
  scenario "User sees an error message when authentication fails" do
    OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
    
    # Visit the login page
    visit '/login'
    
    # This simulates clicking "Sign in with Google" and failing
    visit '/users/auth/failure?message=invalid_credentials&strategy=google_oauth2'
    
    # Should be redirected to the root path after failed authentication
    expect(current_path).to eq(root_path)
    
    # Should display an error message
    expect(page).to have_content("Could not authenticate you from Google")
  end
end 