require 'rails_helper'

RSpec.describe Api::V1::AuthController, type: :request do
  let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
  let(:valid_credentials) { { email: user.email, password: 'password123' } }
  let(:invalid_credentials) { { email: user.email, password: 'wrong_password' } }
  let(:headers) { { 'ACCEPT' => 'application/json', 'CONTENT-TYPE' => 'application/json' } }

  describe 'POST /api/v1/auth/login' do
    context 'with valid credentials' do
      it 'returns a JWT token and user info' do
        post '/api/v1/auth/login', 
             params: valid_credentials, 
             headers: headers,
             as: :json
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        
        expect(json_response).to have_key('token')
        expect(json_response).to have_key('user')
        expect(json_response['user']['email']).to eq(user.email)
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized status' do
        post '/api/v1/auth/login', 
             params: invalid_credentials, 
             headers: headers,
             as: :json
        
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        
        expect(json_response).to have_key('error')
      end
    end
  end

  describe 'POST /api/v1/auth/login_from_session' do
    context 'when user is logged in' do
      before do
        sign_in user
      end

      it 'returns a JWT token and user info' do
        post '/api/v1/auth/login_from_session', 
             headers: headers,
             as: :json
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        
        expect(json_response).to have_key('token')
        expect(json_response).to have_key('user')
        expect(json_response['user']['email']).to eq(user.email)
      end
    end

    context 'when user is not logged in' do
      it 'returns unauthorized status' do
        post '/api/v1/auth/login_from_session', 
             headers: headers,
             as: :json
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/auth/me' do
    context 'when authenticated with JWT' do
      it 'returns the current user info' do
        # First login to get a token
        post '/api/v1/auth/login', 
             params: valid_credentials, 
             headers: headers,
             as: :json
             
        token = JSON.parse(response.body)['token']
        
        # Then use the token to access the me endpoint
        get '/api/v1/auth/me', 
            headers: headers.merge('Authorization' => "Bearer #{token}"),
            as: :json
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        
        expect(json_response).to have_key('user')
        expect(json_response['user']['email']).to eq(user.email)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized status' do
        get '/api/v1/auth/me', 
            headers: headers,
            as: :json
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end 