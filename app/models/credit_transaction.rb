class CreditTransaction < ApplicationRecord
  belongs_to :user

  # Money-Rails integration
  monetize :amount_cents

  # Validations
  validates :transaction_type, presence: true, inclusion: { in: %w[deposit withdrawal call_charge refund] }
  validates :amount_cents, presence: true, numericality: { other_than: 0 }
  validates :stripe_payment_id, presence: true, if: -> { transaction_type == 'deposit' }

  # Scopes
  scope :deposits, -> { where(transaction_type: 'deposit') }
  scope :withdrawals, -> { where(transaction_type: 'withdrawal') }
  scope :call_charges, -> { where(transaction_type: 'call_charge') }
  scope :refunds, -> { where(transaction_type: 'refund') }
end
