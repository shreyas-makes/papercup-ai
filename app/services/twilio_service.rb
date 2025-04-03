# app/services/twilio_service.rb
require 'twilio-ruby'

class TwilioService
  # TODO: Configure Twilio credentials securely (ENV variables)
  ACCOUNT_SID = ENV['TWILIO_ACCOUNT_SID']
  AUTH_TOKEN = ENV['TWILIO_AUTH_TOKEN']
  # TODO: Get a Twilio phone number and configure it
  TWILIO_PHONE_NUMBER = ENV['TWILIO_PHONE_NUMBER']

  def initialize
    # TODO: Handle missing credentials gracefully
    @client = Twilio::REST::Client.new(ACCOUNT_SID, AUTH_TOKEN)
  end

  # Initiates an outbound call via Twilio
  #
  # @param to_number [String] The destination phone number
  # @param from_number [String] The caller ID (must be a verified Twilio number or SIP domain)
  # @param twiml_url [String] URL for TwiML instructions to handle the call
  # @return [Twilio::REST::Api::V2010::AccountContext::CallInstance, nil] The Twilio call object or nil on error
  def make_outbound_call(to_number:, from_number: TWILIO_PHONE_NUMBER, twiml_url:)
    begin
      call = @client.calls.create(
        to: to_number,
        from: from_number,
        url: twiml_url # URL that serves TwiML instructions
        # Add other options like status_callback, record, etc. as needed
      )
      Rails.logger.info "[Twilio] Initiated call SID: #{call.sid} to #{to_number}"
      call
    rescue Twilio::REST::TwilioError => e
      Rails.logger.error "[Twilio] Error making outbound call to #{to_number}: #{e.message}"
      nil
    end
  end

  # TODO: Add methods for other Twilio functionalities (e.g., generating TwiML, handling callbacks)
end 