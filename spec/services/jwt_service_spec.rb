require 'rails_helper'

RSpec.describe JwtService do
  let(:user) { create(:user) }
  
  describe '.encode' do
    it 'generates a JWT token for a user' do
      token = JwtService.encode(user)
      expect(token).to be_present
      
      # Verify token format (header.payload.signature)
      expect(token.split('.').length).to eq(3)
    end
    
    it 'includes user id in the payload' do
      token = JwtService.encode(user)
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base).first
      
      expect(decoded_token['user_id']).to eq(user.id)
    end
    
    it 'sets expiration time' do
      token = JwtService.encode(user)
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base).first
      
      expect(decoded_token['exp']).to be_present
      expect(decoded_token['exp']).to be > Time.current.to_i
    end
  end
  
  describe '.decode' do
    it 'returns user from a valid token' do
      token = JwtService.encode(user)
      decoded_user = JwtService.decode(token)
      
      expect(decoded_user).to eq(user)
    end
    
    it 'returns nil for invalid token' do
      expect(JwtService.decode('invalid.token')).to be_nil
    end
    
    it 'returns nil for expired token' do
      token = JwtService.encode(user, -10) # expired token
      expect(JwtService.decode(token)).to be_nil
    end
    
    it 'returns nil for nil token' do
      expect(JwtService.decode(nil)).to be_nil
    end
  end
end 