# Create a file called test_twilio.rb
require 'twilio-ruby'

account_sid = 'ACe749f7442ee156cfcd5c50367b4ba35c'
auth_token = '9fcb29f74c07a76ca8e06f8583c770ee'
client = Twilio::REST::Client.new(account_sid, auth_token)

begin
  # Make a simple API call to test auth
  account = client.api.account.fetch
  puts "Successfully connected to Twilio account: #{account.friendly_name}"
  
  # Try to list calls
  calls = client.calls.list(limit: 1)
  puts "Found #{calls.length} calls"
rescue => e
  puts "Error connecting to Twilio: #{e.message}"
end