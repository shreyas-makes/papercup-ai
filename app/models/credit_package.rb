class CreditPackage < ApplicationRecord
  monetize :amount_cents
  monetize :price_cents

  validates :name, presence: true
  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :price_cents, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { order(amount_cents: :asc) }
end
