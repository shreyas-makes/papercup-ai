require 'rails_helper'

RSpec.describe PerformanceMonitoringService do
  describe '.measure_db_performance' do
    it 'measures database query duration' do
      allow(Rails.logger).to receive(:info)
      
      result = PerformanceMonitoringService.measure_db_performance do
        User.count
      end
      
      expect(Rails.logger).to have_received(:info).with(/METRIC: database\.query\.duration=/)
    end
    
    it 'warns about slow queries' do
      allow(Rails.logger).to receive(:warn)
      allow(Sentry).to receive(:capture_message)
      
      # Mock slow query by manipulating the time
      allow(Time).to receive(:current).and_return(
        Time.new(2023, 1, 1, 12, 0, 0),
        Time.new(2023, 1, 1, 12, 0, 1) # 1 second later = 1000ms
      )
      
      PerformanceMonitoringService.measure_db_performance do
        true # Just a placeholder
      end
      
      expect(Rails.logger).to have_received(:warn).with(/Slow query detected/)
      expect(Sentry).to have_received(:capture_message).with("Slow database query", any_args)
    end
  end
  
  describe '.monitor_webrtc_quality' do
    it 'reports WebRTC quality metrics' do
      allow(Rails.logger).to receive(:info)
      
      connection_data = {
        rtt: 100,
        jitter: 20,
        packet_loss: 2
      }
      
      PerformanceMonitoringService.monitor_webrtc_quality(connection_data)
      
      expect(Rails.logger).to have_received(:info).with(/METRIC: webrtc\.rtt=100/)
      expect(Rails.logger).to have_received(:info).with(/METRIC: webrtc\.jitter=20/)
      expect(Rails.logger).to have_received(:info).with(/METRIC: webrtc\.packet_loss=2/)
    end
    
    it 'reports poor WebRTC quality' do
      allow(Rails.logger).to receive(:info)
      allow(Sentry).to receive(:capture_message)
      
      connection_data = {
        rtt: 350, # High round trip time
        jitter: 60, # High jitter
        packet_loss: 10 # High packet loss
      }
      
      PerformanceMonitoringService.monitor_webrtc_quality(connection_data)
      
      expect(Sentry).to have_received(:capture_message).with("WebRTC quality issues detected", any_args)
    end
  end
  
  describe '.measure_api_response_time' do
    it 'measures API response time' do
      allow(Rails.logger).to receive(:info)
      
      result = PerformanceMonitoringService.measure_api_response_time('test_controller', 'test_action') do
        "test result"
      end
      
      expect(result).to eq("test result")
      expect(Rails.logger).to have_received(:info).with(/METRIC: api\.response_time=.* controller=test_controller action=test_action/)
    end
  end
end 