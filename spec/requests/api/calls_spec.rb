require 'rails_helper'

RSpec.describe "Api::Calls", type: :request do
  let(:user) { create(:user, credit_balance_cents: 1000) } # Ensure user has credits
  let(:token) { user.jwt_token } # Use the user's jwt_token method
  let(:headers) do
    { 
      'Authorization' => "Bearer #{token}",
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  
  # Stub the authentication for all tests
  before do
    # Only stub User.find_by when looking for our specific user ID
    allow(User).to receive(:find_by).with(id: user.id).and_return(user)
    
    # Only stub JwtService.decode for our specific token
    allow(JwtService).to receive(:decode).with(token).and_return({ "user_id" => user.id })
    
    # Ensure current_user returns our test user
    allow_any_instance_of(Api::CallsController).to receive(:current_user).and_return(user)
  end
  
  # Remove tests for non-existent routes
  # The original auto-generated routes have been commented out in routes.rb
  
  describe "POST /api/calls" do
    let(:valid_params) do
      { call: { phone_number: '+12125551234', country_code: 'US' } }
    end

    it "creates a new call" do
      # Initialize a CallService mock that returns success
      call_service = instance_double(CallService)
      allow(CallService).to receive(:new).and_return(call_service)
      allow(call_service).to receive(:initiate).and_return({ success: true, call: Call.new })
      
      expect {
        post "/api/calls", params: valid_params.to_json, headers: headers.merge({ 'Content-Type' => 'application/json' })
        puts "DEBUG: Response status: #{response.status}"
        puts "DEBUG: Response body: #{response.body}" if response.status != 201
      }.to change(Call, :count).by(1)
      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/calls" do
    before do
      # Create calls for the user
      create_list(:call, 3, user: user)
    end
    
    it "returns a list of calls" do
      get "/api/calls", headers: headers
      puts "DEBUG: Response status: #{response.status}"
      puts "DEBUG: Response body: #{response.body}" if response.status != 200
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.size).to eq(3)
    end
  end

  describe "GET /api/calls/:id" do
    let(:call) { create(:call, user: user) }
    
    it "returns the call details" do
      # Make sure find_call works
      allow_any_instance_of(Api::CallsController).to receive(:find_call).and_call_original
      
      get "/api/calls/#{call.id}", headers: headers
      puts "DEBUG: Response status: #{response.status}"
      puts "DEBUG: Response body: #{response.body}" if response.status != 200
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json["id"]).to eq(call.id)
    end
  end

  describe "PATCH /api/calls/:id" do
    let(:call) { create(:call, user: user) }
    let(:update_params) do
      { call: { phone_number: '+13105551234' } }
    end
    
    it "updates the call" do
      # Make sure find_call works
      allow_any_instance_of(Api::CallsController).to receive(:find_call).and_call_original
      
      patch "/api/calls/#{call.id}", params: update_params.to_json, headers: headers.merge({ 'Content-Type' => 'application/json' })
      puts "DEBUG: Response status: #{response.status}"
      puts "DEBUG: Response body: #{response.body}" if response.status != 200
      
      expect(response).to have_http_status(:success)
      # Reload the call to check if it was updated
      call.reload
      expect(call.phone_number).to eq('+13105551234')
    end
  end
end

