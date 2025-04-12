require 'rails_helper'

RSpec.describe "Stripe Integration", type: :feature do
  include Devise::Test::IntegrationHelpers
  include Warden::Test::Helpers
  
  let(:user) { create(:user, :with_stripe) }
  let(:credit_package) { create(:credit_package, name: 'Test Package', amount_cents: 1000, price_cents: 1000) }
  let(:stripe_session) { double('Stripe::Checkout::Session', id: 'cs_test_123', client_secret: 'secret_123') }
  let(:stripe_event) do
    double(
      type: 'checkout.session.completed',
      data: double(
        object: double(
          metadata: {
            'user_id' => user.id.to_s,
            'credit_package_id' => credit_package.id.to_s
          },
          payment_intent: 'pi_test_123',
          payment_status: 'paid'
        )
      )
    )
  end

  before do
    # Configure test environment
    allow(Rails.configuration.stripe).to receive(:[]).with(:webhook_secret).and_return('whsec_test')
    allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
    allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)
    allow(Stripe::Checkout::Session).to receive(:retrieve).and_return(stripe_session)
    
    # Sign in the user
    login_as(user, scope: :user)
  end

  describe "Credit Purchase Flow" do
    it "completes the entire credit purchase flow", js: true do
      # 1. Visit the credits page
      visit credits_path
      expect(page).to have_content("Purchase Credits")

      # 2. Select a credit package
      find("[data-package-id='#{credit_package.id}']").click
      expect(page).to have_content(credit_package.name)

      # 3. Create checkout session
      expect(Stripe::Checkout::Session).to receive(:create).once.and_return(stripe_session)
      click_button "Purchase"

      # 4. Simulate successful payment webhook
      expect {
        post "/api/stripe_webhooks",
             params: { id: "evt_123" }.to_json,
             headers: { 
               "HTTP_STRIPE_SIGNATURE" => "t=123,v1=abc",
               "CONTENT_TYPE" => "application/json"
             }
      }.to change { user.reload.credit_balance_cents }.by(credit_package.amount_cents)

      # 5. Verify transaction was created
      transaction = CreditTransaction.last
      expect(transaction).to have_attributes(
        user: user,
        amount_cents: credit_package.amount_cents,
        transaction_type: 'deposit',
        stripe_payment_id: 'pi_test_123'
      )

      # 6. Verify success page
      visit credits_path
      expect(page).to have_content("Payment Successful")
    end

    context "when payment fails" do
      let(:stripe_event) do
        double(
          type: 'checkout.session.completed',
          data: double(
            object: double(
              metadata: {
                'user_id' => user.id.to_s,
                'credit_package_id' => credit_package.id.to_s
              },
              payment_intent: 'pi_test_123',
              payment_status: 'failed'
            )
          )
        )
      end

      it "handles failed payment gracefully", js: true do
        visit credits_path
        find("[data-package-id='#{credit_package.id}']").click
        expect(Stripe::Checkout::Session).to receive(:create).once.and_return(stripe_session)
        click_button "Purchase"

        expect {
          post "/api/stripe_webhooks",
               params: { id: "evt_123" }.to_json,
               headers: { 
                 "HTTP_STRIPE_SIGNATURE" => "t=123,v1=abc",
                 "CONTENT_TYPE" => "application/json"
               }
        }.not_to change { user.reload.credit_balance_cents }

        visit credits_path
        expect(page).to have_content("Payment Failed")
      end
    end

    context "with invalid webhook signature" do
      before do
        allow(Stripe::Webhook).to receive(:construct_event)
          .and_raise(Stripe::SignatureVerificationError.new("", ""))
      end

      it "rejects invalid webhooks", js: true do
        visit credits_path
        find("[data-package-id='#{credit_package.id}']").click
        expect(Stripe::Checkout::Session).to receive(:create).once.and_return(stripe_session)
        click_button "Purchase"

        post "/api/stripe_webhooks",
             params: { id: "evt_123" }.to_json,
             headers: { 
               "HTTP_STRIPE_SIGNATURE" => "invalid",
               "CONTENT_TYPE" => "application/json"
             }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end 