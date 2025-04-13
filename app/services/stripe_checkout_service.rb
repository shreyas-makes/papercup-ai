class StripeCheckoutService
  def initialize(user, credit_package)
    @user = user
    @credit_package = credit_package
  end

  def create_session
    Stripe::Checkout::Session.create(
      customer_email: @user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: @credit_package.name,
            description: "#{@credit_package.amount.format} in calling credits"
          },
          unit_amount: @credit_package.price_cents
        },
        quantity: 1
      }],
      metadata: {
        user_id: @user.id,
        credit_package_id: @credit_package.id
      },
      mode: 'payment',
      success_url: "#{Rails.application.routes.url_helpers.root_url}credits/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "#{Rails.application.routes.url_helpers.root_url}credits/cancel"
    )
  end

  def process_successful_payment(session_id)
    session = Stripe::Checkout::Session.retrieve(session_id)
    return unless session.payment_status == 'paid'

    ActiveRecord::Base.transaction do
      @user.with_lock do
        # Get the package for the correct amount
        credit_package = CreditPackage.find(session.metadata.credit_package_id)
        
        # Properly increment the balance using Money-Rails
        @user.credit_balance_cents += credit_package.amount_cents
        @user.save!
        
        CreditTransaction.create!(
          user: @user,
          amount_cents: credit_package.amount_cents,
          transaction_type: 'deposit',
          stripe_payment_id: session.payment_intent
        )
      end
    end
  end
end
