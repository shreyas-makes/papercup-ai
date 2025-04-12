class CreditsController < ApplicationController
  before_action :authenticate_user!

  def index
    @credit_packages = []
    
    package_configs = [
      {
        name: 'Starter',
        identifier: 'starter',
        amount_cents: 5000,
        price_cents: 1000,
        description: 'Perfect for occasional callers'
      },
      {
        name: 'Standard',
        identifier: 'standard',
        amount_cents: 15000,
        price_cents: 2500,
        description: 'Most popular choice'
      },
      {
        name: 'Premium',
        identifier: 'premium',
        amount_cents: 35000,
        price_cents: 5000,
        description: 'For frequent callers'
      }
    ]

    package_configs.each do |config|
      package = CreditPackage.find_by(identifier: config[:identifier])
      if package
        package.update!(config)
      else
        package = CreditPackage.create!(config)
      end
      @credit_packages << package
    end
  end

  def create_checkout_session
    package = CreditPackage.find_by(id: params[:credit_package_id])
    
    if package.nil?
      render json: { error: 'Invalid package' }, status: :bad_request
      return
    end

    begin
      session = Stripe::Checkout::Session.create(
        customer_email: current_user.email,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: package.name,
              description: "#{package.amount_cents / 100.0} credits"
            },
            unit_amount: package.price_cents
          },
          quantity: 1
        }],
        metadata: {
          user_id: current_user.id,
          credit_package_id: package.id
        },
        mode: 'payment',
        success_url: success_credits_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: cancel_credits_url
      )

      render json: { sessionId: session.id }
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :bad_request
    rescue StandardError => e
      Rails.logger.error "Checkout error: #{e.message}"
      render json: { error: "An error occurred while processing your request." }, status: :internal_server_error
    end
  end

  def success
    begin
      @session = Stripe::Checkout::Session.retrieve(params[:session_id])
      
      if @session.payment_status == 'paid'
        package = CreditPackage.find(@session.metadata.credit_package_id)
        current_user.increment!(:credit_balance_cents, package.amount_cents)
        flash[:success] = "Payment successful! Credits have been added to your account."
      else
        flash[:error] = "Payment failed. Please try again."
      end
    rescue StandardError => e
      Rails.logger.error "Success callback error: #{e.message}"
      flash[:error] = "There was an error processing your payment. Please contact support."
    end
    
    redirect_to credits_path
  end

  def cancel
    flash[:notice] = "Payment cancelled. Your card has not been charged."
    redirect_to credits_path
  end
end 