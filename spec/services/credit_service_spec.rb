require 'rails_helper'

RSpec.describe CreditService do
  let(:user) { create(:user, credit_balance_cents: 1000) }
  let(:amount) { Money.new(500) } # $5.00

  describe '#process!' do
    context 'when making a deposit' do
      let(:service) { described_class.new(user, amount, 'deposit', 'py_test123') }

      it 'creates a credit transaction' do
        expect { service.process! }.to change(CreditTransaction, :count).by(1)
      end

      it 'increases the user balance' do
        expect { service.process! }.to change { user.reload.credit_balance_cents }.by(amount.cents)
      end

      it 'returns true on success' do
        expect(service.process!).to eq(true)
      end
    end

    context 'when making a withdrawal' do
      let(:service) { described_class.new(user, amount, 'withdrawal') }

      it 'creates a credit transaction' do
        expect { service.process! }.to change(CreditTransaction, :count).by(1)
      end

      it 'decreases the user balance' do
        expect { service.process! }.to change { user.reload.credit_balance_cents }.by(-amount.cents)
      end

      it 'returns true on success' do
        expect(service.process!).to eq(true)
      end
    end

    context 'when making a call charge' do
      let(:service) { described_class.new(user, amount, 'call_charge') }

      it 'creates a credit transaction' do
        expect { service.process! }.to change(CreditTransaction, :count).by(1)
      end

      it 'decreases the user balance' do
        expect { service.process! }.to change { user.reload.credit_balance_cents }.by(-amount.cents)
      end

      it 'returns true on success' do
        expect(service.process!).to eq(true)
      end
    end

    context 'when issuing a refund' do
      let(:service) { described_class.new(user, amount, 'refund') }

      it 'creates a credit transaction' do
        expect { service.process! }.to change(CreditTransaction, :count).by(1)
      end

      it 'increases the user balance' do
        expect { service.process! }.to change { user.reload.credit_balance_cents }.by(amount.cents)
      end

      it 'returns true on success' do
        expect(service.process!).to eq(true)
      end
    end

    context 'with insufficient balance' do
      let(:user) { create(:user, credit_balance_cents: 200) }
      let(:amount) { Money.new(500) }
      let(:service) { described_class.new(user, amount, 'withdrawal') }

      it 'does not create a transaction' do
        expect { service.process! }.not_to change(CreditTransaction, :count)
      end

      it 'does not change the user balance' do
        expect { service.process! }.not_to change { user.reload.credit_balance_cents }
      end

      it 'returns false on failure' do
        expect(service.process!).to eq(false)
      end
    end
  end
end 