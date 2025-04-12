require 'rails_helper'

RSpec.describe Api::CreditsController, type: :request do
  let(:user) { create(:user, credit_balance_cents: 5000) }
  let(:headers) do
    {
      'Authorization' => "Bearer #{user.jwt_token}",
      'ACCEPT' => 'application/json',
      'CONTENT-TYPE' => 'application/json'
    }
  end
  
  before do
    # Create test credit packages
    @starter = create(:credit_package, name: 'Starter', identifier: 'starter', amount_cents: 5000, price_cents: 1000)
    @standard = create(:credit_package, name: 'Standard', identifier: 'standard', amount_cents: 15000, price_cents: 2500)
    @premium = create(:credit_package, name: 'Premium', identifier: 'premium', amount_cents: 35000, price_cents: 5000)
  end

  describe 'GET /api/credits' do
    it 'returns the user transaction history' do
      create(:credit_transaction, user: user, amount_cents: 1000, transaction_type: 'deposit')
      create(:credit_transaction, user: user, amount_cents: -500, transaction_type: 'call')
      
      get '/api/credits', headers: headers
      
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)
    end
  end

  describe 'GET /api/credits/balance' do
    it 'returns the user credit balance' do
      get '/api/credits/balance', headers: headers
      
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to have_key('balance')
      expect(json_response['balance']).to eq(user.credit_balance.to_s)
    end
  end

  describe 'POST /api/credits/create_checkout_session' do
    let(:session_id) { 'cs_test_123456789' }
    let(:package_id) { @standard.id.to_s }
    
    before do
      # Mock the Stripe checkout session creation
      checkout_service = instance_double(StripeCheckoutService)
      allow(StripeCheckoutService).to receive(:new).and_return(checkout_service)
      
      stripe_session = instance_double(Stripe::Checkout::Session, id: session_id)
      allow(checkout_service).to receive(:create_session).and_return(stripe_session)
    end
    
    it 'creates a Stripe checkout session' do
      post '/api/credits/create_checkout_session', 
           params: { package_id: package_id }.to_json, 
           headers: headers
      
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to have_key('id')
      expect(json_response['id']).to eq(session_id)
    end
    
    it 'handles invalid package ID' do
      post '/api/credits/create_checkout_session', 
           params: { package_id: 'invalid_id' }.to_json, 
           headers: headers
      
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end 