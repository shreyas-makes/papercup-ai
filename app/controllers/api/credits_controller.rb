module Api
  class CreditsController < BaseController
    before_action :authenticate_user_from_token!

    # GET /api/credits (Transaction History)
    def index
      transactions = current_user.credit_transactions.order(created_at: :desc)
      render json: transactions
    end

    # GET /api/credits/show (Balance and Packages)
    def show
      render json: {
        balance: current_user.credit_balance,
        packages: CreditPackage.active
      }
    end

    # GET /api/credits/balance
    def balance
      render json: {
        balance: current_user.credit_balance
      }
    end

    # POST /api/credits/create_checkout_session
    def create_checkout_session
      credit_package = CreditPackage.find(params[:package_id])
      
      begin
        service = StripeCheckoutService.new(current_user, credit_package)
        session = service.create_session
        render json: { id: session.id }
      rescue Stripe::InvalidRequestError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue StandardError => e # Catch other potential errors
        Rails.logger.error "Checkout Session creation failed: #{e.message}"
        render json: { error: 'Could not create checkout session.' }, status: :internal_server_error
      end
    end

    private

    def handle_successful_payment(session)
      user = User.find(session.metadata.user_id)
      credit_package = CreditPackage.find(session.metadata.credit_package_id)

      ActiveRecord::Base.transaction do
        user.with_lock do
          user.increment!(:credit_balance, credit_package.amount_cents)
          
          CreditTransaction.create!(
            user: user,
            amount_cents: credit_package.amount_cents,
            transaction_type: 'deposit',
            stripe_payment_id: session.payment_intent
          )
        end
      end
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error "Failed to process payment: #{e.message}"
    end
  end
end
