# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create an admin user
admin = User.where(email: 'admin@example.com').first_or_create do |user|
  user.password = 'password123'
  user.admin = true
  user.credit_balance_cents = 5000  # $50.00 in credits
  user.timezone = 'America/New_York'
end

puts "Admin user created: #{admin.email} with $#{admin.credit_balance.format}"

# Create a regular user
user = User.where(email: 'user@example.com').first_or_create do |user|
  user.password = 'password123'
  user.credit_balance_cents = 1000  # $10.00 in credits
  user.timezone = 'America/Los_Angeles'
end

puts "Regular user created: #{user.email} with $#{user.credit_balance.format}"

# Create call rates for different countries and prefixes
call_rates = [
  # United States
  { country_code: 'US', prefix: '1', rate_per_min_cents: 100 },  # $1.00/min base rate
  { country_code: 'US', prefix: '1212', rate_per_min_cents: 150 },  # NYC
  { country_code: 'US', prefix: '1415', rate_per_min_cents: 150 },  # San Francisco
  { country_code: 'US', prefix: '1213', rate_per_min_cents: 150 },  # Los Angeles
  
  # Canada
  { country_code: 'CA', prefix: '1', rate_per_min_cents: 120 },  # $1.20/min
  
  # UK
  { country_code: 'GB', prefix: '44', rate_per_min_cents: 180 },  # $1.80/min
  { country_code: 'GB', prefix: '44207', rate_per_min_cents: 200 },  # London
  
  # Germany
  { country_code: 'DE', prefix: '49', rate_per_min_cents: 190 },  # $1.90/min
  
  # France
  { country_code: 'FR', prefix: '33', rate_per_min_cents: 200 },  # $2.00/min
  
  # Australia
  { country_code: 'AU', prefix: '61', rate_per_min_cents: 250 },  # $2.50/min
  
  # Japan
  { country_code: 'JP', prefix: '81', rate_per_min_cents: 300 },  # $3.00/min
]

# Create the call rates
call_rates.each do |attrs|
  existing = CallRate.find_by(country_code: attrs[:country_code], prefix: attrs[:prefix])
  
  unless existing
    rate = CallRate.create!(attrs)
    puts "Created rate for #{rate.country_code} (prefix: #{rate.prefix}) - #{rate.rate_per_min.format}/min"
  end
end

puts "#{CallRate.count} call rates in the system"

# Create credit packages
CreditPackage.create!([
  {
    name: 'Starter Pack',
    amount_cents: 1000, # $10 worth of credits
    price_cents: 1000  # $10 USD
  },
  {
    name: 'Popular Pack',
    amount_cents: 5000, # $50 worth of credits
    price_cents: 4500  # $45 USD (10% discount)
  },
  {
    name: 'Pro Pack',
    amount_cents: 10000, # $100 worth of credits
    price_cents: 8500   # $85 USD (15% discount)
  }
]) if CreditPackage.count.zero?

# Create some sample calls for the regular user
if user.calls.count < 5
  # Sample phone numbers for each country
  us_numbers = ["+12125551234", "+14155556789", "+13235550123"]
  gb_numbers = ["+442071234567", "+441614567890"]
  fr_numbers = ["+33123456789", "+33987654321"]
  
  # Completed calls
  3.times do |i|
    call = Call.create!(
      user: user,
      phone_number: us_numbers[i],
      country_code: 'US',
      start_time: (i+1).days.ago,
      duration_seconds: rand(30..300),
      status: 'completed',
      cost_cents: rand(100..500)
    )
    puts "Created completed call to #{call.phone_number} costing #{call.cost.format}"
  end
  
  # Failed call
  Call.create!(
    user: user,
    phone_number: gb_numbers[0],
    country_code: 'GB',
    start_time: 2.days.ago,
    duration_seconds: 0,
    status: 'failed',
    cost_cents: 0
  )
  puts "Created a failed call"
  
  # Pending call
  Call.create!(
    user: user,
    phone_number: fr_numbers[0],
    country_code: 'FR',
    start_time: Time.current,
    duration_seconds: 0,
    status: 'pending',
    cost_cents: 0
  )
  puts "Created a pending call"
  
  puts "Created #{user.calls.count} sample calls for #{user.email}"
end
