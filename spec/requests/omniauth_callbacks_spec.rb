require 'rails_helper'

RSpec.describe 'OmniAuth Callbacks', type: :request do
  describe 'GET /users/auth/google_oauth2/callback' do
    before do
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
        provider: 'google_oauth2',
        uid: '123456789',
        info: {
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://lh3.googleusercontent.com/a/test'
        },
        credentials: {
          token: 'mock_token',
          refresh_token: 'mock_refresh_token',
          expires_at: 1.hour.from_now.to_i
        }
      })
    end

    after do
      OmniAuth.config.test_mode = false
    end

    context 'when user does not exist' do
      it 'creates a new user from oauth data' do
        expect {
          get '/users/auth/google_oauth2/callback'
        }.to change(User, :count).by(1)

        user = User.last
        expect(user.email).to eq('test@example.com')
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456789')
        expect(user.name).to eq('Test User')
        expect(user.image).to be_present
        expect(user.token).to eq('mock_token')
        expect(user.refresh_token).to eq('mock_refresh_token')
        expect(user.oauth_expires_at).to be_present

        expect(response).to redirect_to(root_path)
      end
    end

    context 'when user already exists' do
      let!(:user) { create(:user, email: 'test@example.com') }

      it 'does not create a new user' do
        expect {
          get '/users/auth/google_oauth2/callback'
        }.not_to change(User, :count)

        user.reload
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456789')
        expect(user.name).to eq('Test User')
        expect(user.image).to be_present
        expect(user.token).to eq('mock_token')
        expect(user.refresh_token).to eq('mock_refresh_token')
        expect(user.oauth_expires_at).to be_present

        expect(response).to redirect_to(root_path)
      end
    end
  end
end 