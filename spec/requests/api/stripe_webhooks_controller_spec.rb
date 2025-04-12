require 'rails_helper'

RSpec.describe Api::StripeWebhooksController, type: :request do
  let(:user) { create(:user, credit_balance_cents: 0) }
  let(:credit_package) { create(:credit_package, amount_cents: 10000, price_cents: 2000) }
  let(:webhook_secret) { 'whsec_test_secret' }
  
  before do
    # Configure the webhook secret
    allow(Rails.configuration.stripe).to receive(:[]).with(:webhook_secret).and_return(webhook_secret)
  end
  
  describe 'POST /api/stripe_webhooks' do
    context 'with checkout.session.completed event' do
      let(:event_data) do
        {
          id: 'evt_test123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              payment_status: 'paid',
              payment_intent: 'pi_test123',
              metadata: {
                user_id: user.id.to_s,
                credit_package_id: credit_package.id.to_s
              }
            }
          }
        }
      end
      
      it 'adds credits to the user account' do
        # Mock the Stripe webhook construction
        allow(Stripe::Webhook).to receive(:construct_event).and_return(Stripe::Event.construct_from(event_data))
        
        # Initial credit balance should be zero
        expect(user.credit_balance_cents).to eq(0)
        
        post '/api/stripe_webhooks', headers: { 'HTTP_STRIPE_SIGNATURE' => 'test_signature' }
        
        expect(response).to have_http_status(:ok)
        
        # User's credit balance should be updated
        user.reload
        expect(user.credit_balance_cents).to eq(credit_package.amount_cents)
        
        # A new transaction should be created
        expect(CreditTransaction.count).to eq(1)
        transaction = CreditTransaction.last
        expect(transaction.user).to eq(user)
        expect(transaction.amount_cents).to eq(credit_package.amount_cents)
        expect(transaction.transaction_type).to eq('deposit')
        expect(transaction.stripe_payment_id).to eq('pi_test123')
      end
      
      it 'handles missing user_id gracefully' do
        event_data[:data][:object][:metadata][:user_id] = nil
        allow(Stripe::Webhook).to receive(:construct_event).and_return(Stripe::Event.construct_from(event_data))
        
        expect {
          post '/api/stripe_webhooks', headers: { 'HTTP_STRIPE_SIGNATURE' => 'test_signature' }
        }.not_to change { CreditTransaction.count }
        
        expect(response).to have_http_status(:ok)
      end
    end
    
    context 'with invalid signature' do
      it 'returns 400 Bad Request' do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(Stripe::SignatureVerificationError.new('', ''))
        
        post '/api/stripe_webhooks', headers: { 'HTTP_STRIPE_SIGNATURE' => 'invalid_signature' }
        
        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end 