# Service for handling user credit operations in an atomic way
class CreditService
  attr_reader :user, :amount, :transaction_type, :stripe_payment_id

  # Initialize the service with the user and credit operation details
  # @param user [User] the user to apply credits to
  # @param amount [Money] the amount to credit/debit
  # @param transaction_type [String] one of CreditTransaction::TYPES
  # @param stripe_payment_id [String] optional Stripe payment ID for deposits
  def initialize(user, amount, transaction_type, stripe_payment_id = nil)
    @user = user
    @amount = amount
    @transaction_type = transaction_type
    @stripe_payment_id = stripe_payment_id
  end

  # Process credit operation in a transaction
  # @return [Boolean] success status
  def process!
    ActiveRecord::Base.transaction do
      transaction = create_transaction
      update_user_balance(transaction)
    end
    true
  rescue StandardError => e
    Rails.logger.error "Credit operation failed: #{e.message}"
    false
  end

  private

  # Create a credit transaction record
  # @return [CreditTransaction] the created transaction
  def create_transaction
    CreditTransaction.create!(
      user: user,
      amount_cents: amount.cents,
      transaction_type: transaction_type,
      stripe_payment_id: stripe_payment_id
    )
  end

  # Update user's credit balance based on transaction type
  # @param transaction [CreditTransaction] the transaction to apply
  # @return [Boolean] update success
  def update_user_balance(transaction)
    # Adjust balance based on transaction type
    amount_to_apply = transaction.amount
    
    # For withdrawals and call charges, we need to negate the amount
    if ['withdrawal', 'call_charge'].include?(transaction.transaction_type)
      amount_to_apply = -amount_to_apply
      
      # Check if sufficient balance
      if user.credit_balance + amount_to_apply.to_money < Money.new(0)
        raise "Insufficient balance for this operation"
      end
    end
    
    # Update the user's balance
    new_balance = user.credit_balance + amount_to_apply.to_money
    user.update!(credit_balance_cents: new_balance.cents)
  end
end 