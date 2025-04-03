require 'rails_helper'

RSpec.describe CallService, type: :model do
  let(:user) { create(:user, credit_balance_cents: 1000) } # $10 balance
  let(:call) { create(:call, user: user, status: 'pending', phone_number: '12125551234', country_code: 'US') }
  let(:service) { CallService.new(call) }
  
  describe '#initiate' do
    context 'when user has sufficient credits' do
      before do
        allow(user).to receive(:has_sufficient_credits?).and_return(true)
        allow(InitiateCallJob).to receive(:perform_later)
      end
      
      it 'updates call status to initiated' do
        result = service.initiate
        
        expect(result[:success]).to be true
        expect(call.status).to eq('initiated')
        expect(call.start_time).not_to be_nil
      end
      
      it 'creates an initiated event' do
        expect { service.initiate }.to change { CallEvent.count }.by(1)
        expect(CallEvent.last.event_type).to eq('initiated')
      end
      
      it 'enqueues the InitiateCallJob' do
        service.initiate
        
        expect(InitiateCallJob).to have_received(:perform_later).with(call.id)
      end
    end
    
    context 'when user has insufficient credits' do
      before do
        allow(user).to receive(:has_sufficient_credits?).and_return(false)
      end
      
      it 'sets call status to failed' do
        result = service.initiate
        
        expect(result[:success]).to be false
        expect(call.status).to eq('failed')
        expect(call.failure_reason).to eq('insufficient_credits')
      end
    end
  end
  
  describe '#update_status' do
    before do
      allow(CallBillingJob).to receive(:perform_later)
    end
    
    it 'updates the call status' do
      service.update_status('ringing')
      
      expect(call.status).to eq('ringing')
    end
    
    it 'creates a call event' do
      expect { service.update_status('ringing') }.to change { CallEvent.count }.by(1)
      expect(CallEvent.last.event_type).to eq('ringing')
    end
    
    context 'when status is completed' do
      it 'sets end_time and schedules billing' do
        service.update_status('completed')
        
        expect(call.end_time).not_to be_nil
        expect(CallBillingJob).to have_received(:perform_later).with(call.id)
      end
    end
  end
  
  describe '#calculate_cost' do
    context 'with an existing rate' do
      let(:rate) { instance_double(CallRate, rate_per_min: Money.new(100, 'USD')) } # $1 per minute
      
      before do
        allow(CallRate).to receive(:find_rate_for_number).and_return(rate)
      end
      
      it 'calculates cost based on duration and rate' do
        # 60 seconds at $1/min = $1
        cost = service.calculate_cost(60)
        expect(cost).to eq(Money.new(100, 'USD'))
        
        # 30 seconds at $1/min = $0.50
        cost = service.calculate_cost(30)
        expect(cost).to eq(Money.new(50, 'USD'))
      end
    end
    
    context 'with no existing rate' do
      before do
        allow(CallRate).to receive(:find_rate_for_number).and_return(nil)
      end
      
      it 'uses the default rate' do
        # 60 seconds at default $0.50/min = $0.50
        cost = service.calculate_cost(60)
        expect(cost).to eq(Money.new(50, 'USD'))
      end
    end
  end
  
  describe '#terminate' do
    let(:twilio_client) { instance_double(Twilio::REST::Client) }
    let(:twilio_calls) { double('twilio_calls') }
    let(:twilio_call) { double('twilio_call') }
    
    before do
      call.update(twilio_sid: 'CA123456789', status: 'in_progress')
      
      allow(Twilio::REST::Client).to receive(:new).and_return(twilio_client)
      allow(twilio_client).to receive(:calls).with('CA123456789').and_return(twilio_call)
      allow(twilio_call).to receive(:update).with(status: 'completed')
    end
    
    it 'terminates the call in Twilio' do
      service.terminate
      
      expect(twilio_client).to have_received(:calls).with('CA123456789')
      expect(twilio_call).to have_received(:update).with(status: 'completed')
    end
    
    it 'sets the call status to terminated' do
      service.terminate
      
      expect(call.status).to eq('terminated')
    end
  end
end
