require 'rails_helper'

RSpec.describe Api::WebrtcController, type: :request do
  let(:user) { create(:user) }
  let(:headers) do
    {
      'Authorization' => "Bearer #{user.jwt_token}",
      'ACCEPT' => 'application/json',
      'CONTENT-TYPE' => 'application/json'
    }
  end
  
  describe 'POST /api/webrtc/token' do
    let(:token) { 'test_webrtc_token_123' }
    
    before do
      # Mock the JWT token generation
      allow_any_instance_of(JwtService).to receive(:generate_webrtc_token).and_return(token)
    end
    
    it 'returns a WebRTC token when authenticated' do
      post '/api/webrtc/token', headers: headers
      
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to have_key('token')
      expect(json_response['token']).to eq(token)
      
      # Should also include STUN/TURN server configuration
      expect(json_response).to have_key('ice_servers')
      expect(json_response['ice_servers']).to be_an(Array)
    end
    
    it 'returns unauthorized when not authenticated' do
      post '/api/webrtc/token'
      
      expect(response).to have_http_status(:unauthorized)
    end
  end
end 