class User < ApplicationRecord
  include Signupable
  include Onboardable
  include Billable

  # Money-Rails integration
  monetize :credit_balance_cents, as: "credit_balance"

  # Associations
  has_many :calls, dependent: :nullify
  has_many :credit_transactions, dependent: :nullify

  scope :subscribed, -> { where.not(stripe_subscription_id: [nil, '']) }
  scope :with_positive_balance, -> { where('credit_balance_cents > 0') }

  # :nocov:
  def self.ransackable_attributes(*)
    ["id", "admin", "created_at", "updated_at", "email", "stripe_customer_id", "stripe_subscription_id", "paying_customer", "credit_balance_cents", "timezone"]
  end

  def self.ransackable_associations(_auth_object)
    ["calls", "credit_transactions"]
  end
  # :nocov:
end
