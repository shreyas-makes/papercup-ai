class User < ApplicationRecord
  include Signupable
  include Onboardable
  include Billable

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  # Money-Rails integration
  monetize :credit_balance_cents

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
      user.password = Devise.friendly_token[0,20]
      user.name = auth.info.name
      user.image = auth.info.image
      # Add any additional required fields
    end
  end

  def jwt_token
    JwtService.encode({ user_id: id })
  end

  # Check if the user has sufficient credits for a call to a specific country
  # @param country_code [String] The country code to check rates for
  # @param duration [Integer] Optional estimated call duration in seconds
  # @return [Boolean] True if user has sufficient credits
  def has_sufficient_credits?(country_code, duration = 60)
    # Get minimum credits required (1 minute worth of call)
    rate = CallRate.find_rate_for_number('', country_code)
    
    if rate.nil?
      # Use default rate if no specific rate is found
      min_credits_required = Money.new(50, 'USD') # $0.50 per minute as default
    else
      min_credits_required = rate.rate_per_min
    end
    
    # Calculate cost for the given duration
    estimated_cost = (duration.to_f / 60) * min_credits_required
    
    # Check if user has at least the minimum required credits
    credit_balance >= estimated_cost
  end
  
  # Deduct credits from user balance
  # @param amount [Money] Amount to deduct
  # @return [Boolean] True if successful
  def deduct_credits(amount)
    return false if amount > credit_balance
    
    self.credit_balance -= amount
    save!
  end

  # Credit balance methods
  def sufficient_balance?(amount)
    credit_balance >= amount
  end

  def low_balance?
    credit_balance < 500 # $5.00 threshold
  end

  def estimated_minutes_remaining
    return Float::INFINITY if credit_balance.zero?
    
    average_rate = CallRate.average(:rate_per_min_cents) || 100 # Default to $1/min if no rates
    (credit_balance / average_rate).floor
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
