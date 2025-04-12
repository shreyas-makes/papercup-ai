class PerformanceMonitoringService
  # Monitor database query performance
  def self.measure_db_performance(&block)
    start_time = Time.current
    result = block.call
    duration = (Time.current - start_time) * 1000 # Convert to milliseconds
    
    # Send metrics to monitoring system
    report_metric("database.query.duration", duration)
    
    # Log slow queries
    if duration > 500
      Rails.logger.warn "Slow query detected (#{duration.round(2)}ms)"
      Sentry.capture_message("Slow database query", level: :warning, 
                            extra: { duration: duration })
    end
    
    result
  end
  
  # Monitor WebRTC connection quality
  def self.monitor_webrtc_quality(connection_data)
    # Extract metrics
    round_trip_time = connection_data[:rtt] || 0
    jitter = connection_data[:jitter] || 0
    packet_loss = connection_data[:packet_loss] || 0
    
    # Report metrics
    report_metric("webrtc.rtt", round_trip_time)
    report_metric("webrtc.jitter", jitter)
    report_metric("webrtc.packet_loss", packet_loss)
    
    # Check for quality issues
    if round_trip_time > 300 || jitter > 50 || packet_loss > 5
      Sentry.capture_message("WebRTC quality issues detected", level: :warning,
                            extra: { rtt: round_trip_time, jitter: jitter, packet_loss: packet_loss })
    end
  end
  
  # Monitor memory usage
  def self.measure_memory_usage
    memory_usage = GetProcessMem.new.mb
    report_metric("system.memory.usage_mb", memory_usage)
    
    # Alert on high memory usage
    if memory_usage > 500
      Sentry.capture_message("High memory usage detected", level: :warning,
                            extra: { memory_usage_mb: memory_usage })
    end
    
    memory_usage
  end
  
  # Monitor API response times
  def self.measure_api_response_time(controller, action, &block)
    start_time = Time.current
    result = block.call
    duration = (Time.current - start_time) * 1000 # Convert to milliseconds
    
    # Send metrics to monitoring system
    report_metric("api.response_time", duration, tags: { controller: controller, action: action })
    
    # Log slow responses
    if duration > 1000
      Rails.logger.warn "Slow API response (#{duration.round(2)}ms): #{controller}##{action}"
      Sentry.capture_message("Slow API response", level: :warning,
                            extra: { duration: duration, controller: controller, action: action })
    end
    
    result
  end
  
  # Monitor background job performance
  def self.measure_job_performance(job_class, &block)
    start_time = Time.current
    result = block.call
    duration = (Time.current - start_time) * 1000 # Convert to milliseconds
    
    # Send metrics to monitoring system
    report_metric("background_job.duration", duration, tags: { job_class: job_class })
    
    # Log slow jobs
    if duration > 30000
      Rails.logger.warn "Slow background job (#{duration.round(2)}ms): #{job_class}"
      Sentry.capture_message("Slow background job", level: :warning,
                            extra: { duration: duration, job_class: job_class })
    end
    
    result
  end
  
  private
  
  def self.report_metric(name, value, tags: {})
    # In real application, this would send to StatsD, Datadog, New Relic, etc.
    # For now, just log it
    Rails.logger.info("METRIC: #{name}=#{value} #{tags.map { |k, v| "#{k}=#{v}" }.join(' ')}")
    
    # Could be implemented with your preferred monitoring service:
    # Datadog.send_metric(name, value, tags)
    # or
    # StatsD.measure(name, value, tags: tags)
  end
end 