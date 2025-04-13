namespace :setup do
  desc "Add test Twilio credentials to the Rails credentials file"
  task :twilio_test_credentials => :environment do
    puts "This task will help you add Twilio test credentials to your Rails credentials file."
    puts "You'll need your Twilio account SID, auth token, and a Twilio phone number."
    puts "You can find these in your Twilio console at https://www.twilio.com/console"
    puts ""
    
    # Instructions for editing credentials
    puts "To add Twilio credentials, run:"
    puts "EDITOR=vim bin/rails credentials:edit"
    puts ""
    puts "Then add the following section to your credentials file:"
    puts ""
    puts "twilio:"
    puts "  account_sid: 'AC123...your_account_sid'"
    puts "  auth_token: 'a1b2c3...your_auth_token'"
    puts "  phone_number: '+1234567890'"
    puts ""
    puts "Save and close the file when done."
    puts ""
    
    # Check if credentials already exist
    if Rails.application.credentials.twilio.present?
      puts "Twilio credentials already exist in your credentials file."
      puts "Account SID: #{Rails.application.credentials.twilio[:account_sid]}"
      puts "Phone Number: #{Rails.application.credentials.twilio[:phone_number]}"
    else
      puts "No Twilio credentials found in your credentials file."
    end
  end
  
  desc "Set up test environment variables for Twilio"
  task :twilio_test_env => :environment do
    puts "For development testing, you can also use environment variables."
    puts "Add these to your .env file or export them in your shell:"
    puts ""
    puts "export TWILIO_ACCOUNT_SID='AC123...your_account_sid'"
    puts "export TWILIO_AUTH_TOKEN='a1b2c3...your_auth_token'"
    puts "export TWILIO_PHONE_NUMBER='+1234567890'"
    puts ""
    puts "Remember to restart your Rails server after setting these variables."
  end
end 