require 'rails_helper'

RSpec.describe Users::OmniauthCallbacksController, type: :controller do
  before do
    # Mock Devise OmniAuth mapping
    @request.env["devise.mapping"] = Devise.mappings[:user]
    
    # Create a mock OmniAuth hash
    @auth_hash = OmniAuth::AuthHash.new({
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
    
    # Set up the auth hash in the request environment
    @request.env["omniauth.auth"] = @auth_hash
    
    # Allow Billable concern to skip real Stripe API calls
    allow_any_instance_of(User).to receive(:setup_stripe_customer).and_return(true)
  end

  describe "#google_oauth2" do
    context "when user doesn't exist" do
      it "creates a new user" do
        expect {
          get :google_oauth2
        }.to change(User, :count).by(1)
      end

      it "sets user attributes correctly" do
        get :google_oauth2
        
        user = User.last
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456789')
      end
      
      it "signs in the user and redirects to root" do
        get :google_oauth2
        
        expect(controller.current_user).not_to be_nil
        expect(response).to redirect_to(root_path)
        expect(flash[:notice]).to be_present
      end
    end

    context "when user already exists" do
      let!(:existing_user) do
        User.create!(
          email: 'test@example.com',
          password: 'password123',
          provider: 'google_oauth2',
          uid: '123456789',
          name: 'Test User'
        )
      end

      it "does not create a new user" do
        expect {
          get :google_oauth2
        }.not_to change(User, :count)
      end

      it "signs in the existing user" do
        get :google_oauth2
        
        expect(controller.current_user).to eq(existing_user)
        expect(response).to redirect_to(root_path)
      end
    end
  end

  describe "#failure" do
    it "redirects to root with an error message" do
      get :failure, params: { message: 'invalid_credentials' }
      
      expect(response).to redirect_to(root_path)
      expect(flash[:alert]).to be_present
      expect(flash[:alert]).to include('invalid_credentials')
    end
  end
end 