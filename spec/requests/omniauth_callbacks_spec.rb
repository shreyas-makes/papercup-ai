require 'rails_helper'

RSpec.describe "OmniAuth Callbacks", type: :request do
  before do
    OmniAuth.config.test_mode = true
    
    # Set up the mock for Google OAuth2
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
    
    # Allow Billable concern to skip real Stripe API calls
    allow_any_instance_of(User).to receive(:setup_stripe_customer).and_return(true)
    
    # Mock the OmniAuth callback request (this simulates what happens after the user
    # authenticates with Google and gets redirected back to our app)
    Rails.application.env_config["devise.mapping"] = Devise.mappings[:user]
    Rails.application.env_config["omniauth.auth"] = OmniAuth.config.mock_auth[:google_oauth2]
  end

  describe "Google OAuth2" do
    context "when user doesn't exist" do
      it "creates a new user and redirects to root path" do
        expect {
          # Simulate the callback being hit directly (in real usage, this happens after
          # the provider redirects back to your app with authorization code)
          get "/users/auth/google_oauth2/callback"
        }.to change(User, :count).by(1)
        
        expect(response).to redirect_to(root_path)
        expect(flash[:notice]).to be_present
        
        # Check user attributes
        user = User.last
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456789')
      end
    end

    context "when user already exists" do
      let!(:existing_user) do
        User.create!(
          email: 'test@example.com',
          password: 'password123',
          provider: 'google_oauth2',
          uid: '123456789'
        )
      end

      it "signs in the existing user and redirects to root path" do
        expect {
          get "/users/auth/google_oauth2/callback"
        }.not_to change(User, :count)
        
        expect(response).to redirect_to(root_path)
      end
    end
  end
  
  describe "Authentication failure" do
    before do
      OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
      Rails.application.env_config["omniauth.auth"] = OmniAuth.config.mock_auth[:google_oauth2]
    end

    it "redirects to root path with an error message" do
      # Testing the failure callback directly
      get "/users/auth/failure?message=invalid_credentials&strategy=google_oauth2"
      
      expect(response).to redirect_to(root_path)
      expect(flash[:alert]).to be_present
    end
  end
end 