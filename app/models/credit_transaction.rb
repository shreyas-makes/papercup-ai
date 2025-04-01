class CreditTransaction < ApplicationRecord
  belongs_to :user

  # Money-Rails integration
  monetize :amount_cents, as: "amount"

  # Validations
  validates :transaction_type, presence: true
  validates :amount_cents, presence: true, numericality: { other_than: 0 }

  # Transaction types
  TYPES = ['deposit', 'withdrawal', 'refund', 'call_charge']
  
  validates :transaction_type, inclusion: { in: TYPES }
end
