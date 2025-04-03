require 'rails_helper'

RSpec.describe JwtService do
  describe '.encode' do
    it 'encodes a payload with JWT' do
      payload = { user_id: 123 }
      
      token = JwtService.encode(payload)
      
      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3) # Header, payload, signature
    end
    
    it 'adds an expiration time to the payload' do
      payload = { user_id: 123 }
      
      allow(Time).to receive(:now).and_return(Time.at(0))
      token = JwtService.encode(payload)
      
      decoded_payload = JWT.decode(
        token,
        JwtService.send(:secret_key),
        true,
        { algorithm: JwtService::ALGORITHM }
      ).first
      
      expect(decoded_payload).to include('exp')
      expect(decoded_payload['exp']).to eq((Time.at(0) + 24.hours).to_i)
    end
  end
  
  describe '.decode' do
    it 'decodes a valid token' do
      payload = { 'test_key' => 'test_value' }
      token = JwtService.encode(payload)
      
      result = JwtService.decode(token)
      
      expect(result).to include('test_key' => 'test_value')
      expect(result).to include('exp')
    end
    
    it 'returns nil for an invalid token' do
      result = JwtService.decode('invalid.token.here')
      
      expect(result).to be_nil
    end
    
    it 'returns nil for an expired token' do
      payload = { 'user_id' => 1, 'exp' => 1.hour.ago.to_i }
      
      # Manually encode with expired token
      token = JWT.encode(
        payload,
        JwtService.send(:secret_key), 
        JwtService::ALGORITHM
      )
      
      result = JwtService.decode(token)
      
      expect(result).to be_nil
    end
  end
  
  describe '.secret_key' do
    it 'uses the environment variable if available' do
      # Store original value
      original_env = ENV['JWT_SECRET_KEY']
      ENV['JWT_SECRET_KEY'] = 'test_secret_key'
      
      expect(JwtService.send(:secret_key)).to eq('test_secret_key')
      
      # Restore original value
      ENV['JWT_SECRET_KEY'] = original_env
    end
    
    it 'falls back to Rails secret key base if env variable not set' do
      # Store original value
      original_env = ENV['JWT_SECRET_KEY']
      ENV['JWT_SECRET_KEY'] = nil
      
      expect(JwtService.send(:secret_key)).to eq(Rails.application.secret_key_base)
      
      # Restore original value
      ENV['JWT_SECRET_KEY'] = original_env
    end
  end
end 