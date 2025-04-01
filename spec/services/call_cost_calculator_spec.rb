require 'rails_helper'

RSpec.describe CallCostCalculator do
  let(:user) { create(:user) }
  let(:call_rate) { create(:call_rate, country_code: 'US', prefix: '1', rate_per_min_cents: 100) }
  
  describe '#calculate' do
    context 'with a valid call and rate' do
      let(:call) { create(:call, user: user, phone_number: '+12125551234', country_code: 'US', duration_seconds: 90) }
      let(:calculator) { described_class.new(call, call_rate) }
      
      it 'calculates the cost based on duration' do
        # 90 seconds = 2 minutes (rounded up), at $1.00/min = $2.00
        expect(calculator.calculate).to eq(Money.new(200))
      end
      
      it 'rounds up to the nearest minute' do
        call.duration_seconds = 61 # Just over 1 minute
        expect(calculator.calculate).to eq(Money.new(200)) # Should charge for 2 minutes
      end
    end
    
    context 'with zero duration' do
      let(:call) { create(:call, user: user, duration_seconds: 0) }
      let(:calculator) { described_class.new(call, call_rate) }
      
      it 'returns zero cost' do
        expect(calculator.calculate).to eq(Money.new(0))
      end
    end
    
    context 'with nil duration' do
      let(:call) { create(:call, user: user, duration_seconds: nil) }
      let(:calculator) { described_class.new(call, call_rate) }
      
      it 'returns zero cost' do
        expect(calculator.calculate).to eq(Money.new(0))
      end
    end
    
    context 'with no matching rate' do
      let(:call) { create(:call, user: user, duration_seconds: 60) }
      let(:calculator) { described_class.new(call, nil) }
      
      it 'returns zero cost' do
        expect(calculator.calculate).to eq(Money.new(0))
      end
    end
  end
  
  describe '#apply_cost!' do
    let(:call) { create(:call, user: user, phone_number: '+12125551234', country_code: 'US', duration_seconds: 60, cost_cents: 0) }
    let(:calculator) { described_class.new(call, call_rate) }
    
    it 'updates the call with the calculated cost' do
      calculator.apply_cost!
      expect(call.reload.cost_cents).to eq(100)
    end
    
    it 'returns true on success' do
      expect(calculator.apply_cost!).to be true
    end
  end
  
  describe '#find_rate' do
    before do
      create(:call_rate, country_code: 'US', prefix: '1', rate_per_min_cents: 100)
      create(:call_rate, country_code: 'US', prefix: '1212', rate_per_min_cents: 150)
    end
    
    context 'with a NYC number' do
      let(:call) { create(:call, user: user, phone_number: '+12125551234', country_code: 'US') }
      let(:calculator) { described_class.new(call) }
      
      it 'finds the most specific rate' do
        expect(calculator.send(:find_rate).prefix).to eq('1212')
        expect(calculator.send(:find_rate).rate_per_min_cents).to eq(150)
      end
    end
    
    context 'with a general US number' do
      let(:call) { create(:call, user: user, phone_number: '+13335551234', country_code: 'US') }
      let(:calculator) { described_class.new(call) }
      
      it 'finds the general rate' do
        expect(calculator.send(:find_rate).prefix).to eq('1')
        expect(calculator.send(:find_rate).rate_per_min_cents).to eq(100)
      end
    end
  end
end 