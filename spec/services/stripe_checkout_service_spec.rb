require 'rails_helper'

RSpec.describe StripeCheckoutService do
  let(:user) { create(:user) }
  let(:credit_package) { create(:credit_package, name: 'Basic', amount_cents: 1000, price_cents: 1000) }
  let(:service) { StripeCheckoutService.new(user, credit_package) }

  describe "#create_session" do
    let(:stripe_session) { double('Stripe::Checkout::Session', id: 'cs_test_123') }

    before do
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)
    end

    it "calls Stripe::Checkout::Session.create with correct parameters" do
      expected_params = {
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Basic',
              description: '$10.00 in calling credits' # Assuming default Money format
            },
            unit_amount: 1000
          },
          quantity: 1
        }],
        metadata: {
          user_id: user.id,
          credit_package_id: credit_package.id
        },
        mode: 'payment',
        success_url: "http://localhost:3000/credits/success?session_id={CHECKOUT_SESSION_ID}", # Adjust host as needed
        cancel_url: "http://localhost:3000/credits/cancel" # Adjust host as needed
      }

      service.create_session

      expect(Stripe::Checkout::Session).to have_received(:create).with(expected_params)
    end

    it "returns the created Stripe session" do
      expect(service.create_session).to eq(stripe_session)
    end
  end

  # Note: Testing process_successful_payment would require more complex mocking 
  # or integration tests with Stripe webhooks, which are handled elsewhere.
end
