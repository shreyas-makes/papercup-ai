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
CreditPackage::PACKAGE_IDENTIFIERS.each do |identifier, details|
  CreditPackage.find_or_create_by!(identifier: identifier) do |package|
    package.name = details[:name]
    package.amount_cents = details[:amount] * 100  # Convert to cents
    package.price_cents = details[:price] * 100    # Convert to cents
  end
end

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

# Create test users
puts "Creating test users..."
admin_user = User.where(email: 'admin@example.com').first_or_create do |user|
  user.password = 'password'
  user.admin = true
end

test_user = User.where(email: 'user@example.com').first_or_create do |user|
  user.password = 'password'
end

# Create test calls
puts "Creating test calls..."
statuses = ['initiated', 'connecting', 'in_progress', 'completed', 'dropped', 'failed']
countries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR', 'IN']

# Clear existing test calls (but keep existing real data)
test_user.calls.destroy_all

30.days.ago.to_date.upto(Date.today) do |date|
  # Random number of calls per day (0-5)
  rand(0..5).times do
    # Create a call in the past
    time_offset = rand(0..23).hours + rand(0..59).minutes
    created_time = date.to_time + time_offset
    
    # Get a random duration (1-600 seconds)
    duration = rand(1..600)
    
    # Randomly select completed or another status
    status = rand < 0.8 ? 'completed' : statuses.sample
    
    # Add some randomness to end time
    ended_at = status == 'completed' ? created_time + duration.seconds : nil
    
    # Create call with Money-Rails cost
    call = test_user.calls.create!(
      phone_number: "+1#{rand(200..999)}#{rand(100..999)}#{rand(1000..9999)}",
      country_code: countries.sample,
      status: status,
      created_at: created_time,
      started_at: status == 'initiated' ? nil : created_time,
      ended_at: ended_at,
      cost_cents: duration * rand(1..5),
      duration: duration
    )
    
    # Only create metrics for completed calls
    if status == 'completed'
      # Create multiple quality metrics for the call
      # Initial quality is better and degrades during call
      base_jitter = rand(5..15)
      base_packet_loss = rand(0.1..1.0)
      base_latency = rand(50..150)
      
      # Create a metric every 5-10 seconds
      metric_count = (duration / rand(5..10)).floor
      metric_count = 1 if metric_count < 1
      
      metric_count.times do |i|
        # Quality degrades slightly over time
        degradation = (i.to_f / metric_count) * rand(0.5..2.0)
        
        CallMetric.create!(
          call: call,
          jitter: base_jitter * (1 + degradation),
          packet_loss: base_packet_loss * (1 + degradation),
          latency: base_latency * (1 + degradation),
          bitrate: rand(800..3000),
          codec: ['opus', 'aac', 'g722'].sample,
          resolution: ['480p', '720p', '1080p'].sample,
          created_at: created_time + (i * (duration / metric_count)).seconds,
          raw_data: {
            rtt: base_latency * (1 + degradation),
            packets_sent: rand(1000..5000),
            packets_received: rand(1000..5000),
            packets_lost: rand(0..100)
          }
        )
      end
    end
  end
end

puts "Created #{test_user.calls.count} test calls with #{CallMetric.count} metrics."
