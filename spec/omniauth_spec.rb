require 'rails_helper'

# This spec focuses just on testing the OAuth integration
RSpec.describe "OmniAuth Integration", type: :model do
  before do
    # Skip Stripe customer creation in tests
    allow_any_instance_of(User).to receive(:setup_stripe_customer).and_return(true)
  end
  
  describe "User.from_omniauth" do
    let(:auth_hash) do
      OmniAuth::AuthHash.new({
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
    
    context "when user doesn't exist" do
      it "creates a new user with OAuth data" do
        expect {
          User.from_omniauth(auth_hash)
        }.to change(User, :count).by(1)
        
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
          uid: '123456789',
          name: 'Existing User'
        )
      end
      
      it "returns the existing user" do
        expect {
          user = User.from_omniauth(auth_hash)
          expect(user).to eq(existing_user)
        }.not_to change(User, :count)
      end
    end
  end
  
  describe "JWT token integration" do
    it "generates a JWT token for a user via JwtService" do
      user = User.create!(email: 'jwt@example.com', password: 'password123')
      
      # Get the token from user method (which should use JwtService)
      token = user.jwt_token
      
      # Attempt to decode with JwtService
      decoded_payload = JwtService.decode(token)
      
      # Verify the token contains the expected data
      expect(decoded_payload).to be_a(Hash)
      expect(decoded_payload["user_id"]).to eq(user.id)
    end
    
    it "has a properly implemented JwtService" do
      # Test the JwtService directly
      payload = { "test_key" => "test_value" }
      token = JwtService.encode(payload)
      decoded = JwtService.decode(token)
      
      expect(decoded["test_key"]).to eq("test_value")
      expect(decoded).to have_key("exp") # Expiration time
    end
  end
end 