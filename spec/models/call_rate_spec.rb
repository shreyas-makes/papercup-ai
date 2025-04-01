require 'rails_helper'

RSpec.describe CallRate, type: :model do
  describe 'monetize' do
    it { should monetize(:rate_per_min_cents).as(:rate_per_min) }
  end

  describe 'validations' do
    it { should validate_presence_of(:country_code) }
    it { should validate_presence_of(:prefix) }
    it { should validate_presence_of(:rate_per_min_cents) }
    
    it { should validate_numericality_of(:rate_per_min_cents).is_greater_than(0) }
    
    describe 'uniqueness' do
      subject { build(:call_rate) }
      it { should validate_uniqueness_of(:prefix).scoped_to(:country_code) }
    end
  end
  
  describe '.find_rate_for_number' do
    before do
      # Create test rates with numeric prefixes for this specific test
      @rate_us_general = create(:call_rate, country_code: 'US', prefix: '1', rate_per_min_cents: 100)
      @rate_us_nyc = create(:call_rate, country_code: 'US', prefix: '1212', rate_per_min_cents: 150)
      @rate_uk = create(:call_rate, country_code: 'GB', prefix: '44', rate_per_min_cents: 180)
    end
    
    context 'with a NYC number' do
      let(:call) { create(:call, user: user, phone_number: '+12125551234', country_code: 'US') }
      let(:calculator) { described_class.new(call) }
      
      it 'finds the most specific rate' do
        rate = CallRate.find_rate_for_number('+12125551234', 'US')
        expect(rate.prefix).to eq('1212')
        expect(rate.rate_per_min_cents).to eq(150)
      end
    end
    
    context 'with a general US number' do
      let(:call) { create(:call, user: user, phone_number: '+13335551234', country_code: 'US') }
      let(:calculator) { described_class.new(call) }
      
      it 'finds the general rate' do
        rate = CallRate.find_rate_for_number('+13335551234', 'US')
        expect(rate.prefix).to eq('1')
        expect(rate.rate_per_min_cents).to eq(100)
      end
    end
    
    it 'handles formatted phone numbers correctly' do
      rate = CallRate.find_rate_for_number('(212) 333-4444', 'US')
      expect(rate).to eq(@rate_us_nyc)
      expect(rate.prefix).to eq('1212')
    end
  end
end
