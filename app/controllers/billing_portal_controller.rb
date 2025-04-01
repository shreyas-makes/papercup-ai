class BillingPortalController < ApplicationController
  before_action :authenticate_user!
  skip_before_action :verify_authenticity_token, only: [:create] # ajax

  def new
    session = Stripe::Checkout::Session.retrieve(params[:session_id])

    if session.status == 'complete'
      # Add credits to user's account based on the package purchased
      amount = session.amount_total / 100.0 # Convert cents to dollars
      credits = calculate_credits(amount)
      current_user.update(credit_balance: current_user.credit_balance + credits)
      
      redirect_to dashboard_index_path, notice: "#{credits} credits have been added to your account!"
    else
      redirect_to subscribe_path, alert: "There was an error processing your payment. Please try again."
    end
  rescue Stripe::StripeError => e
    redirect_to subscribe_path, alert: "Payment error: #{e.message}"
  end

  def create
    respond_to do |format|
      format.html { redirect_to subscribe_path }
      format.json { render json: create_checkout }
    end
  rescue Stripe::StripeError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def create_checkout
    # Get package details from params
    package_id = params[:package_id] || 'standard' # Default to standard package
    package = credit_packages[package_id.to_sym]

    session = Stripe::Checkout::Session.create({
      ui_mode: 'embedded',
      customer: stripe_customer,
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: "#{package[:name]} Credit Package",
            description: "#{package[:credits]} calling credits"
          },
          unit_amount: package[:price] * 100 # Convert dollars to cents
        },
        quantity: 1
      }],
      mode: 'payment', # one-time payment for credits
      return_url: "#{request.base_url}#{new_billing_portal_path}?session_id={CHECKOUT_SESSION_ID}"
    })

    { clientSecret: session.client_secret }
  end

  def stripe_customer
    return current_user.stripe_customer_id if current_user.stripe_customer_id.present?

    begin
      customer = Stripe::Customer.create({
        email: current_user.email,
        metadata: {
          user_id: current_user.id
        }
      })
      current_user.update!(stripe_customer_id: customer.id)
      customer.id
    rescue ActiveRecord::RecordNotUnique
      # In case of race condition, reload user and return existing customer id
      current_user.reload.stripe_customer_id
    end
  end

  def calculate_credits(amount)
    # Find the package that matches the amount paid
    package = credit_packages.values.find { |p| p[:price] == amount }
    package ? package[:credits] : (amount * 5).to_i # Fallback: $1 = 5 credits
  end

  def credit_packages
    {
      starter: { id: 'starter', name: 'Starter', price: 10, credits: 50 },
      standard: { id: 'standard', name: 'Standard', price: 25, credits: 150 },
      premium: { id: 'premium', name: 'Premium', price: 50, credits: 350 }
    }
  end
end
