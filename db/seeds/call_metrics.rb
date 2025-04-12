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

# First delete existing metrics to avoid foreign key issues
puts "Deleting existing metrics..."
CallMetric.delete_all if defined?(CallMetric)

# Then delete calls
puts "Deleting existing calls..."
test_user.calls.delete_all if test_user.respond_to?(:calls)

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
      cost_cents: duration * rand(1..5)
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