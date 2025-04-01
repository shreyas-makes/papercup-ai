require 'rails_helper'

RSpec.describe Call, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'monetize' do
    it { should monetize(:cost_cents).as(:cost) }
  end

  describe 'validations' do
    it { should validate_presence_of(:phone_number) }
    it { should validate_presence_of(:country_code) }
    it { should validate_presence_of(:status) }
  end

  describe 'scopes' do
    let(:user) { create(:user) }
    
    describe '.recent' do
      let!(:old_call) { create(:call, user: user, start_time: 2.days.ago) }
      let!(:new_call) { create(:call, user: user, start_time: 1.hour.ago) }
      
      it 'returns calls ordered by start_time desc' do
        expect(Call.recent.pluck(:id)).to eq([new_call.id, old_call.id])
      end
    end

    describe '.successful' do
      let!(:completed_call) { create(:call, user: user, status: 'completed') }
      let!(:pending_call) { create(:call, user: user, status: 'pending') }
      let!(:failed_call) { create(:call, user: user, status: 'failed') }
      
      it 'returns only completed calls' do
        expect(Call.successful.pluck(:id)).to eq([completed_call.id])
      end
    end

    describe '.by_country' do
      let!(:us_call) { create(:call, user: user, country_code: 'US') }
      let!(:fr_call) { create(:call, user: user, country_code: 'FR') }
      
      it 'returns calls for a specific country' do
        expect(Call.by_country('US').pluck(:id)).to eq([us_call.id])
        expect(Call.by_country('FR').pluck(:id)).to eq([fr_call.id])
      end
    end

    describe '.daily_volume' do
      let!(:call_yesterday) { create(:call, user: user, status: 'completed', start_time: 1.day.ago) }
      let!(:call_today) { create(:call, user: user, status: 'completed', start_time: Time.current) }
      let!(:call_pending) { create(:call, user: user, status: 'pending', start_time: Time.current) }
      
      it 'returns count of successful calls grouped by date' do
        result = Call.daily_volume
        expect(result.keys.count).to eq(2)
        expect(result[call_yesterday.start_time.to_date]).to eq(1)
        expect(result[call_today.start_time.to_date]).to eq(1)
      end
    end
  end
end
