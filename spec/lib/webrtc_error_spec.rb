require 'rails_helper'
require_relative '../../app/lib/webrtc_error'

RSpec.describe WebRtcError do
  describe 'initialization' do
    it 'sets error attributes from metadata' do
      metadata = {
        connection_state: 'failed',
        ice_state: 'disconnected',
        signal_state: 'closed'
      }
      
      error = WebRtcError.new('Test WebRTC error', :test_error, metadata)
      
      expect(error.connection_state).to eq('failed')
      expect(error.ice_state).to eq('disconnected')
      expect(error.signal_state).to eq('closed')
      expect(error.error_type).to eq(:test_error)
      expect(error.message).to eq('Test WebRTC error')
    end
    
    it 'stores state in thread variables for Sentry context' do
      metadata = {
        connection_state: 'failed',
        ice_state: 'disconnected',
        signal_state: 'closed'
      }
      
      WebRtcError.new('Test WebRTC error', :test_error, metadata)
      
      expect(Thread.current[:webrtc_connection_state]).to eq('failed')
      expect(Thread.current[:webrtc_ice_gathering_state]).to eq('disconnected')
      expect(Thread.current[:webrtc_signaling_state]).to eq('closed')
    end
  end
  
  describe 'factory methods' do
    it 'creates a connection_failed error' do
      error = WebRtcError.connection_failed
      
      expect(error).to be_a(WebRtcError)
      expect(error.error_type).to eq(:connection_failed)
      expect(error.message).to eq('WebRTC connection failed')
    end
    
    it 'creates a media_error error' do
      error = WebRtcError.media_error
      
      expect(error).to be_a(WebRtcError)
      expect(error.error_type).to eq(:media_error)
      expect(error.message).to eq('WebRTC media access error')
    end
    
    it 'creates an ice_failure error' do
      error = WebRtcError.ice_failure
      
      expect(error).to be_a(WebRtcError)
      expect(error.error_type).to eq(:ice_failure)
      expect(error.message).to eq('WebRTC ICE connection failure')
    end
    
    it 'creates a signaling_error error' do
      error = WebRtcError.signaling_error
      
      expect(error).to be_a(WebRtcError)
      expect(error.error_type).to eq(:signaling_error)
      expect(error.message).to eq('WebRTC signaling error')
    end
    
    it 'creates a call_setup_failure error' do
      error = WebRtcError.call_setup_failure
      
      expect(error).to be_a(WebRtcError)
      expect(error.error_type).to eq(:call_setup_failure)
      expect(error.message).to eq('WebRTC call setup failure')
    end
  end
end 