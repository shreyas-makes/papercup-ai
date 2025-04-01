require 'rails_helper'

RSpec.describe CallCompletionService do
  let(:user) { create(:user, credit_balance_cents: 1000) }
  let(:call) { create(:call, user: user, status: 'pending', duration_seconds: 0, cost_cents: 0) }
  let(:service) { described_class.new(call) }
  
  before do
    create(:call_rate, country_code: call.country_code, prefix: '1', rate_per_min_cents: 100)
  end
  
  describe '#complete!' do
    context 'with a successful completion' do
      it 'updates the call duration' do
        expect { service.complete!(120) }.to change { call.reload.duration_seconds }.from(0).to(120)
      end
      
      it 'calculates and applies the cost' do
        expect { service.complete!(120) }.to change { call.reload.cost_cents }.from(0).to(200)
      end
      
      it 'charges the user for the call' do
        expect { service.complete!(120) }.to change { user.reload.credit_balance_cents }.from(1000).to(800)
      end
      
      it 'creates a credit transaction for the charge' do
        expect { service.complete!(120) }.to change(CreditTransaction, :count).by(1)
        
        transaction = CreditTransaction.last
        expect(transaction.transaction_type).to eq('call_charge')
        expect(transaction.amount_cents).to eq(200)
      end
      
      it 'marks the call as completed' do
        expect { service.complete!(120) }.to change { call.reload.status }.from('pending').to('completed')
      end
      
      it 'returns true on success' do
        expect(service.complete!(120)).to eq(true)
      end
    end
    
    context 'with insufficient balance' do
      let(:user) { create(:user, credit_balance_cents: 100) }
      
      it 'does not change the user balance' do
        expect { service.complete!(120) }.not_to change { user.reload.credit_balance_cents }
      end
      
      it 'does not create a credit transaction' do
        expect { service.complete!(120) }.not_to change(CreditTransaction, :count)
      end
      
      it 'marks the call as failed' do
        expect { service.complete!(120) }.to change { call.reload.status }.from('pending').to('failed')
      end
      
      it 'returns false on failure' do
        expect(service.complete!(120)).to eq(false)
      end
    end
    
    context 'with zero duration' do
      it 'does not charge the user' do
        expect { service.complete!(0) }.not_to change { user.reload.credit_balance_cents }
      end
      
      it 'marks the call as completed' do
        expect { service.complete!(0) }.to change { call.reload.status }.from('pending').to('completed')
      end
    end
  end
end 