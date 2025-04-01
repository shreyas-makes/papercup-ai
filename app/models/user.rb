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

  # Class method for OAuth authentication
  def self.from_omniauth(auth)
    # Find existing user by provider and uid
    user = where(provider: auth.provider, uid: auth.uid).first
    
    # If user exists, update their credentials
    if user
      user.update(
        token: auth.credentials.token,
        refresh_token: auth.credentials.refresh_token,
        oauth_expires_at: auth.credentials.expires_at.present? ? Time.at(auth.credentials.expires_at) : nil,
        image: auth.info.image,
        name: auth.info.name
      )
      return user
    end
    
    # Otherwise, find user by email or create new one
    where(email: auth.info.email).first_or_create do |new_user|
      new_user.provider = auth.provider
      new_user.uid = auth.uid
      new_user.email = auth.info.email
      new_user.password = Devise.friendly_token[0, 20]
      new_user.name = auth.info.name
      new_user.image = auth.info.image
      new_user.token = auth.credentials.token
      new_user.refresh_token = auth.credentials.refresh_token
      new_user.oauth_expires_at = auth.credentials.expires_at.present? ? Time.at(auth.credentials.expires_at) : nil
    end
  end

  # :nocov:
  def self.ransackable_attributes(*)
    ["id", "admin", "created_at", "updated_at", "email", "stripe_customer_id", "stripe_subscription_id", "paying_customer", "credit_balance_cents", "timezone"]
  end

  def self.ransackable_associations(_auth_object)
    ["calls", "credit_transactions"]
  end
  # :nocov:
end
