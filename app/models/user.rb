class User < ApplicationRecord
  include Signupable
  include Onboardable
  include Billable

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  # Money-Rails integration
  monetize :credit_balance_cents, as: "credit_balance"

  # Associations
  has_many :calls, dependent: :nullify
  has_many :credit_transactions, dependent: :nullify

  scope :subscribed, -> { where.not(stripe_subscription_id: [nil, '']) }
  scope :with_positive_balance, -> { where('credit_balance_cents > 0') }

  validates :email, presence: true, uniqueness: true
  validates :credit_balance, numericality: { greater_than_or_equal_to: 0 }

  # Class method for OAuth authentication
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.avatar_url = auth.info.image
      user.oauth_token = auth.credentials.token
      user.oauth_expires_at = Time.at(auth.credentials.expires_at) if auth.credentials.expires_at
    end
  end

  def jwt_token
    JwtService.encode({ user_id: id })
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
