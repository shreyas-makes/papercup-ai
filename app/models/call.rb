class Call < ApplicationRecord
  belongs_to :user

  # Money-Rails integration
  monetize :cost_cents, as: "cost"

  # Validations
  validates :phone_number, :country_code, :status, presence: true

  # Scopes
  scope :recent, -> { order(start_time: :desc) }
  scope :successful, -> { where(status: 'completed') }
  scope :by_country, ->(country_code) { where(country_code: country_code) }
  scope :daily_volume, -> { 
    successful.group("DATE(start_time)").count 
  }
end
