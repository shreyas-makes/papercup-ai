class CreditTransactionService
  def self.add_credits(user, amount, source, metadata = {})
    ActiveRecord::Base.transaction do
      user.with_lock do
        user.credit_balance_cents += amount
        user.save!
        
        CreditTransaction.create!(
          user: user,
          amount_cents: amount,
          transaction_type: source,
          stripe_payment_id: metadata[:stripe_payment_id],
          metadata: metadata.except(:stripe_payment_id)
        )
      end
    end
  end

  def self.deduct_credits(user, amount, call = nil)
    ActiveRecord::Base.transaction do
      user.with_lock do
        if user.credit_balance_cents >= amount
          user.credit_balance_cents -= amount
          user.save!
          
          CreditTransaction.create!(
            user: user,
            amount_cents: -amount,
            transaction_type: 'call_charge',
            metadata: { call_id: call&.id }
          )
          
          true
        else
          false
        end
      end
    end
  end

  def self.refund_credits(user, amount, original_transaction)
    ActiveRecord::Base.transaction do
      user.with_lock do
        user.credit_balance_cents += amount
        user.save!
        
        CreditTransaction.create!(
          user: user,
          amount_cents: amount,
          transaction_type: 'refund',
          metadata: { 
            original_transaction_id: original_transaction.id,
            reason: 'refund'
          }
        )
      end
    end
  end
end
