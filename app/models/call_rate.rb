class CallRate < ApplicationRecord
  # Money-Rails integration
  monetize :rate_per_min_cents, as: "rate_per_min"

  # Validations
  validates :country_code, :prefix, presence: true
  validates :rate_per_min_cents, presence: true, numericality: { greater_than: 0 }
  
  # Ensure unique prefix per country
  validates :prefix, uniqueness: { scope: :country_code }
  
  # Find rate for a given phone number
  def self.find_rate_for_number(phone_number, country_code)
    return nil if phone_number.blank?
    
    # Remove any non-digit characters from the phone number
    digits = phone_number.to_s.gsub(/\D/, '')
    
    # Make sure the digits aren't empty after cleaning
    return nil if digits.blank?
    
    # Add country code prefix if not present for US numbers
    if country_code == 'US' && !digits.start_with?('1')
      digits = "1#{digits}"
    end
    
    # Find the rate with the longest matching prefix for this country and phone number
    # by comparing the start of the phone number to each prefix
    rates = where(country_code: country_code)
      .select { |rate| digits.start_with?(rate.prefix) }
      .sort_by { |rate| -rate.prefix.length }
    
    # Return the most specific match (longest prefix)
    rates.first
  end
end
