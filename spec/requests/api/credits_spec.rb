require 'rails_helper'

RSpec.describe "Api::Credits", type: :request do
  let(:user) { create(:user, credit_balance_cents: 1000) }
  let!(:package1) { create(:credit_package, name: 'Small', amount_cents: 500, price_cents: 500) }
  let!(:package2) { create(:credit_package, name: 'Large', amount_cents: 2000, price_cents: 1800) }
  let!(:transaction1) { create(:credit_transaction, user: user, amount_cents: 500, transaction_type: 'deposit', stripe_payment_id: 'pi_abc', created_at: 1.day.ago) }
  let!(:transaction2) { create(:credit_transaction, user: user, amount_cents: -200, transaction_type: 'call_charge', created_at: 12.hours.ago) }
  let!(:other_user_transaction) { create(:credit_transaction, transaction_type: 'deposit', stripe_payment_id: 'pi_def') } # Belongs to a different user

  # Test the controller methods directly
  describe "CreditsController methods" do
    let(:controller) { Api::CreditsController.new }
    
    before do
      # Setup controller
      allow(controller).to receive(:current_user).and_return(user)
      allow(controller).to receive(:params).and_return({})
      allow(controller).to receive(:render)
    end
    
    it "index returns the user's credit transactions in descending order" do
      expect(controller).to receive(:render).with(json: [transaction2, transaction1])
      controller.index
    end
    
    it "show returns the current user's balance and packages" do
      expect(controller).to receive(:render).with(
        json: {
          balance: user.credit_balance,
          packages: CreditPackage.active
        }
      )
      controller.show
    end
    
    context "create_checkout_session" do
      let(:stripe_session) { double('Stripe::Checkout::Session', id: 'cs_test_123') }
      let(:service) { instance_double(StripeCheckoutService) }
      
      before do
        allow(controller).to receive(:params).and_return({ package_id: package1.id })
        allow(StripeCheckoutService).to receive(:new).and_return(service)
      end
      
      it "returns a successful checkout session" do
        expect(service).to receive(:create_session).and_return(stripe_session)
        expect(controller).to receive(:render).with(json: { id: 'cs_test_123' })
        controller.create_checkout_session
      end
      
      it "handles Stripe API errors" do
        expect(service).to receive(:create_session).and_raise(Stripe::InvalidRequestError.new('Bad request', 'param'))
        expect(controller).to receive(:render).with(
          json: { error: 'Bad request' }, 
          status: :unprocessable_entity
        )
        controller.create_checkout_session
      end
      
      it "handles other errors" do
        expect(service).to receive(:create_session).and_raise(StandardError.new('Something went wrong'))
        expect(Rails.logger).to receive(:error)
        expect(controller).to receive(:render).with(
          json: { error: 'Could not create checkout session.' },
          status: :internal_server_error
        )
        controller.create_checkout_session
      end
    end
  end
  
  # Integration test for the StripeCheckoutService
  describe "StripeCheckoutService" do
    let(:stripe_session) { double('Stripe::Checkout::Session', id: 'cs_test_123') }
    
    before do
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)
    end
    
    it "creates a Stripe checkout session" do
      service = StripeCheckoutService.new(user, package1)
      session = service.create_session
      
      expect(session.id).to eq('cs_test_123')
    end
  end
end
