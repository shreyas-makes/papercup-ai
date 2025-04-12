class CallQualityService
  # Track WebRTC metrics for a specific call
  # @param call_id [Integer] ID of the call
  # @param metrics [Hash] WebRTC statistics and quality metrics
  def self.track_metrics(call_id, metrics)
    call = Call.find_by(id: call_id)
    return false unless call
    
    CallMetric.create!(
      call: call,
      jitter: metrics[:jitter],
      packet_loss: metrics[:packet_loss],
      latency: metrics[:latency],
      bitrate: metrics[:bitrate],
      codec: metrics[:codec],
      resolution: metrics[:resolution],
      raw_data: metrics
    )
  end

  # Analyze call quality based on collected metrics
  # @param call [Call] The call object to analyze
  # @return [Hash] Quality analysis results
  def self.analyze_call(call)
    metrics = call.call_metrics.order(created_at: :asc)
    return { quality: :unknown } if metrics.empty?
    
    avg_jitter = metrics.average(:jitter).to_f
    avg_packet_loss = metrics.average(:packet_loss).to_f
    avg_latency = metrics.average(:latency).to_f
    
    quality_score = calculate_quality_score(avg_jitter, avg_packet_loss, avg_latency)
    quality_rating = rate_quality(quality_score)
    
    {
      quality: quality_rating,
      score: quality_score,
      jitter: avg_jitter,
      packet_loss: avg_packet_loss,
      latency: avg_latency,
      sample_count: metrics.count,
      duration: call.duration
    }
  end
  
  # Calculate aggregated call quality metrics for all calls in a date range
  # @param start_date [Date] Start date for analysis
  # @param end_date [Date] End date for analysis
  # @return [Hash] Aggregated quality metrics
  def self.aggregate_metrics(start_date, end_date)
    calls = Call.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
    
    total_calls = calls.count
    completed_calls = calls.where.not(ended_at: nil).count
    dropped_calls = calls.where(status: "dropped").count
    
    metrics = CallMetric.joins(:call)
      .where(calls: { created_at: start_date.beginning_of_day..end_date.end_of_day })
    
    {
      total_calls: total_calls,
      completed_calls: completed_calls,
      dropped_calls: dropped_calls,
      drop_rate: total_calls > 0 ? (dropped_calls.to_f / total_calls) : 0,
      avg_duration: calls.average(:duration).to_f,
      avg_jitter: metrics.average(:jitter).to_f,
      avg_packet_loss: metrics.average(:packet_loss).to_f,
      avg_latency: metrics.average(:latency).to_f
    }
  end
  
  private
  
  # Calculate a quality score based on key metrics
  # @param jitter [Float] Average jitter in ms
  # @param packet_loss [Float] Packet loss percentage (0-100)
  # @param latency [Float] Latency in ms
  # @return [Float] Quality score from 0-100
  def self.calculate_quality_score(jitter, packet_loss, latency)
    # Lower is better for all these metrics
    jitter_score = [100 - (jitter * 5), 0].max
    packet_loss_score = [100 - (packet_loss * 10), 0].max
    latency_score = [100 - (latency / 10), 0].max
    
    # Weighted average (packet loss impacts quality the most)
    (jitter_score * 0.3) + (packet_loss_score * 0.5) + (latency_score * 0.2)
  end
  
  # Convert numerical score to rating
  # @param score [Float] Quality score from 0-100
  # @return [Symbol] Quality rating
  def self.rate_quality(score)
    case score
    when 90..100 then :excellent
    when 70...90 then :good
    when 50...70 then :fair
    when 30...50 then :poor
    else :bad
    end
  end
end 