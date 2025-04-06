require 'rails_helper'

RSpec.describe "Api::StripeWebhooks", type: :request do
  describe "POST /api/stripe_webhooks" do
    let(:user) { create(:user) }
    let(:credit_package) { create(:credit_package, amount_cents: 5000) }
    let(:stripe_signature) { "t=123,v1=abc" }
    let(:webhook_secret) { "whsec_test" }
    let(:event) do
      double(
        type: "checkout.session.completed",
        data: double(
          object: double(
            metadata: {
              'user_id' => user.id.to_s,
              'credit_package_id' => credit_package.id.to_s
            },
            payment_intent: "pi_123"
          )
        )
      )
    end

    before do
      allow(Rails.configuration.stripe).to receive(:[]).with(:webhook_secret).and_return(webhook_secret)
      allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    end

    context "with checkout.session.completed event" do
      it "adds credits to the user" do
        expect {
          post "/api/stripe_webhooks",
               params: { id: "evt_123" }.to_json,
               headers: { "HTTP_STRIPE_SIGNATURE" => stripe_signature }
        }.to change { user.reload.credit_balance_cents }.by(5000)

        expect(response).to have_http_status(:ok)
      end

      it "creates a credit transaction" do
        expect {
          post "/api/stripe_webhooks",
               params: { id: "evt_123" }.to_json,
               headers: { "HTTP_STRIPE_SIGNATURE" => stripe_signature }
        }.to change(CreditTransaction, :count).by(1)

        transaction = CreditTransaction.last
        expect(transaction.user).to eq(user)
        expect(transaction.amount_cents).to eq(5000)
        expect(transaction.transaction_type).to eq("deposit")
        expect(transaction.stripe_payment_id).to eq("pi_123")
        expect(transaction.metadata["credit_package_id"]).to eq(credit_package.id)
      end
    end

    context "with invalid signature" do
      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(Stripe::SignatureVerificationError.new("", ""))
      end

      it "returns bad request" do
        post "/api/stripe_webhooks",
             params: { id: "evt_123" }.to_json,
             headers: { "HTTP_STRIPE_SIGNATURE" => "invalid" }

        expect(response).to have_http_status(:bad_request)
      end
    end

    context "with invalid JSON" do
      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(JSON::ParserError)
      end

      it "returns bad request" do
        post "/api/stripe_webhooks",
             params: "invalid json",
             headers: { "HTTP_STRIPE_SIGNATURE" => stripe_signature }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
