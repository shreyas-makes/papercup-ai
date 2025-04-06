require 'rails_helper'

RSpec.describe "JWT Authentication", type: :request do
  let(:user) { create(:user) }
  let(:jwt_token) { JwtService.encode({ user_id: user.id }) }
  
  describe "API access with JWT token" do
    it "allows access to API endpoints with valid JWT token" do
      # Make a request with the JWT token in the Authorization header
      get "/api/credits", headers: { 'Authorization': "Bearer #{jwt_token}" }
      
      # Should return successful response
      expect(response).to have_http_status(:success)
      expect(response.content_type).to include('application/json')
    end
    
    it "denies access with invalid JWT token" do
      # Make a request with an invalid JWT token
      get "/api/credits", headers: { 'Authorization': "Bearer invalid_token" }
      
      # Should return unauthorized
      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to have_key('error')
    end
    
    it "denies access with no token" do
      # Make a request with no token
      get "/api/credits"
      
      # Should return unauthorized
      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to have_key('error')
    end
  end
  
  describe "Token generation after OAuth authentication" do
    it "generates a valid JWT token for the user" do
      # Create a user that would typically be created via OAuth
      oauth_user = create(:user, provider: 'google_oauth2', uid: '12345')
      
      # Generate a JWT token
      token = oauth_user.jwt_token
      
      # Verify the token contains the correct user_id
      payload = JwtService.decode(token)
      expect(payload).to include('user_id' => oauth_user.id)
      
      # Verify the token can be used for authentication
      get "/api/credits", headers: { 'Authorization': "Bearer #{token}" }
      expect(response).to have_http_status(:success)
    end
  end
end
