# Replace the entire file with this simplified version
require 'twilio-ruby'

# Single configuration using environment variables
Twilio.configure do |config|
  config.account_sid = ENV['TWILIO_ACCOUNT_SID']
  config.auth_token = ENV['TWILIO_AUTH_TOKEN']
end

# Log Twilio configuration in development
if Rails.env.development?
  Rails.logger.info "Twilio initialized with Account SID: #{ENV['TWILIO_ACCOUNT_SID'].to_s.gsub(/.(?=.{4})/, '*')}"
  Rails.logger.info "Twilio Auth Token provided: #{ENV['TWILIO_AUTH_TOKEN'].present?}"
  Rails.logger.info "Twilio Phone Number configured as: #{ENV['TWILIO_PHONE_NUMBER']}"
end

# Add helper method to check if Twilio is properly configured
module TwilioHelper
  def self.configured?
    return false unless defined?(Twilio::REST::Client)
    
    begin
      # Use explicit credentials instead of relying on global config
      client = Twilio::REST::Client.new(ENV['TWILIO_ACCOUNT_SID'], ENV['TWILIO_AUTH_TOKEN'])
      account = client.api.account.fetch
      true
    rescue Twilio::REST::TwilioError => e
      Rails.logger.error "Twilio configuration error: #{e.message}"
      false
    end
  end
end

# Log Twilio configuration status on startup
Rails.application.config.after_initialize do
  if TwilioHelper.configured?
    Rails.logger.info "Twilio configured successfully!"
  else
    Rails.logger.warn "Twilio NOT properly configured! Outbound calls will likely fail."
  end
end 