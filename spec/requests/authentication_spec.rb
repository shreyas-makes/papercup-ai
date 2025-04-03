require 'rails_helper'

RSpec.describe "Authentication", type: :request do
  describe "Email/Password Authentication" do
    let(:user_params) { { email: "test@example.com", password: "password123" } }
    
    context "signup" do
      it "creates a new user account" do
        expect {
          post user_registration_path, params: { user: user_params }
        }.to change(User, :count).by(1)
      end
      
      it "redirects to the subscribe page after signup" do
        post user_registration_path, params: { user: user_params }
        expect(response).to redirect_to(subscribe_path)
      end
    end
    
    context "login" do
      let!(:user) { User.create!(user_params) }
      
      it "signs in the user" do
        post user_session_path, params: { user: user_params }
        expect(controller.current_user).to eq(user)
      end
      
      it "redirects to the dashboard for paying customers" do
        user.update(paying_customer: true)
        post user_session_path, params: { user: user_params }
        expect(response).to redirect_to(dashboard_index_path)
      end
      
      it "redirects to the subscribe page for non-paying customers" do
        post user_session_path, params: { user: user_params }
        expect(response).to redirect_to(subscribe_path)
      end
    end
    
    context "logout" do
      let!(:user) { User.create!(user_params) }
      
      it "signs out the user" do
        post user_session_path, params: { user: user_params }
        expect(controller.current_user).to eq(user)
        
        delete destroy_user_session_path
        expect(controller.current_user).to be_nil
      end
    end
  end
  
  describe "API Authentication" do
    let(:user) { User.create!(email: "api@example.com", password: "password123") }
    let(:token) { JwtService.encode({ user_id: user.id }) }
    
    describe "POST /api/v1/auth/login" do
      it "returns a JWT token for valid credentials" do
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }
        expect(response).to have_http_status(:success)
        
        json = JSON.parse(response.body)
        expect(json["token"]).to be_present
        expect(json["user"]["id"]).to eq(user.id)
      end
      
      it "returns unauthorized for invalid credentials" do
        post "/api/v1/auth/login", params: { email: user.email, password: "wrong_password" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
    
    describe "GET /api/v1/auth/me" do
      it "returns user data for authenticated requests" do
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
        expect(response).to have_http_status(:success)
        
        json = JSON.parse(response.body)
        expect(json["user"]["id"]).to eq(user.id)
        expect(json["user"]["email"]).to eq(user.email)
      end
      
      it "returns unauthorized for unauthenticated requests" do
        get "/api/v1/auth/me"
        expect(response).to have_http_status(:unauthorized)
      end
      
      it "returns unauthorized for invalid tokens" do
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer invalid_token" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
    
    describe "Access to protected routes" do
      let(:protected_route) { dashboard_index_path }
      
      it "allows access to authenticated users" do
        sign_in user
        get protected_route
        expect(response).to have_http_status(:success)
      end
      
      it "redirects unauthenticated users to the login page" do
        get protected_route
        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end 