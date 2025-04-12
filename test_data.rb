# Create test users
puts "Creating test users..."
admin = User.where(email: 'admin@example.com').first_or_create do |user|
  user.password = 'password'
  user.admin = true
end

user = User.where(email: 'user@example.com').first_or_create do |user|
  user.password = 'password'
end

# Create test calls - but first remove existing data
puts "Cleaning up existing test data..."
Call.where(user: user).find_each do |call|
  call.call_metrics.destroy_all
  call.destroy
end

# Call data
puts "Creating test calls..."
statuses = ['initiated', 'connecting', 'in_progress', 'completed', 'dropped', 'failed']
countries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR', 'IN']

# Create calls for the last 7 days
7.days.ago.to_date.upto(Date.today) do |date|
  # 2-3 calls per day
  rand(2..3).times do
    # Create a call in the past
    time_offset = rand(0..23).hours + rand(0..59).minutes
    created_time = date.to_time + time_offset
    
    # Get a random duration (30-300 seconds)
    duration = rand(30..300)
    
    # Most calls are completed
    status = rand < 0.8 ? 'completed' : statuses.sample
    
    # Add some randomness to end time
    ended_at = status == 'completed' ? created_time + duration.seconds : nil
    
    # Create call
    call = user.calls.create!(
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
      # Create 2-5 metrics per call
      rand(2..5).times do |i|
        # Create metrics with increasing timestamps
        metric_time = created_time + (i * (duration / 5)).seconds
        
        # Quality degrades over time
        degradation = (i.to_f / 5) * rand(0.5..2.0)
        
        # Create the metric
        CallMetric.create!(
          call: call,
          jitter: rand(5..15) * (1 + degradation),
          packet_loss: rand(0.1..1.0) * (1 + degradation),
          latency: rand(50..150) * (1 + degradation),
          bitrate: rand(800..3000),
          codec: ['opus', 'aac', 'g722'].sample,
          resolution: ['480p', '720p', '1080p'].sample,
          created_at: metric_time,
          raw_data: {
            packets_sent: rand(1000..5000),
            packets_received: rand(1000..5000),
            packets_lost: rand(0..100)
          }
        )
      end
    end
  end
end

puts "Created #{user.calls.count} test calls with #{CallMetric.count} metrics." 