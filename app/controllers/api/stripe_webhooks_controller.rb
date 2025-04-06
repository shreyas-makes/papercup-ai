module Api
  class StripeWebhooksController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :verify_stripe_webhook

    def create
      case event.type
      when 'checkout.session.completed'
        handle_checkout_session_completed(event.data.object)
      when 'payment_intent.succeeded'
        handle_payment_intent_succeeded(event.data.object)
      end

      head :ok
    rescue JSON::ParserError, ActionDispatch::Http::Parameters::ParseError
      head :bad_request
    rescue Stripe::SignatureVerificationError
      head :bad_request
    end

    private

    def event
      @event ||= begin
        payload = request.raw_post
        sig_header = request.env['HTTP_STRIPE_SIGNATURE']
        Stripe::Webhook.construct_event(
          payload, sig_header, Rails.configuration.stripe[:webhook_secret]
        )
      end
    end

    def handle_checkout_session_completed(session)
      return unless session.metadata['user_id'].present?

      user = User.find_by(id: session.metadata['user_id'])
      return unless user

      credit_package = CreditPackage.find_by(id: session.metadata['credit_package_id'])
      return unless credit_package

      CreditTransactionService.add_credits(
        user,
        credit_package.amount_cents,
        'deposit',
        stripe_payment_id: session.payment_intent,
        credit_package_id: credit_package.id
      )
    end

    def handle_payment_intent_succeeded(payment_intent)
      # We'll handle this if needed in the future
      # This is more for direct PaymentIntent usage rather than Checkout Sessions
    end

    def verify_stripe_webhook
      return if Rails.env.test?
      return head :bad_request if request.raw_post.empty?
    end
  end
end
