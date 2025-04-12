class CreditPackage < ApplicationRecord
  monetize :amount_cents
  monetize :price_cents

  validates :name, presence: true
  validates :identifier, presence: true, uniqueness: true
  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :price_cents, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { order(amount_cents: :asc) }
  scope :find_by_identifier, ->(identifier) { find_by(identifier: identifier) }

  PACKAGE_IDENTIFIERS = {
    'starter' => { name: 'Starter', amount: 50, price: 10 },
    'standard' => { name: 'Standard', amount: 150, price: 25 },
    'premium' => { name: 'Premium', amount: 350, price: 50 }
  }
end
