require 'rails_helper'

RSpec.describe CreditTransactionService do
  let(:user) { create(:user, credit_balance_cents: 1000) }
  let(:call) { create(:call, user: user) }

  describe '.add_credits' do
    it 'adds credits to user balance' do
      expect {
        CreditTransactionService.add_credits(user, 500, 'deposit', stripe_payment_id: 'pi_123')
      }.to change { user.reload.credit_balance_cents }.by(500)
    end

    it 'creates a transaction record' do
      expect {
        CreditTransactionService.add_credits(user, 500, 'deposit', stripe_payment_id: 'pi_123')
      }.to change(CreditTransaction, :count).by(1)

      transaction = CreditTransaction.last
      expect(transaction.amount_cents).to eq(500)
      expect(transaction.transaction_type).to eq('deposit')
      expect(transaction.stripe_payment_id).to eq('pi_123')
    end
  end

  describe '.deduct_credits' do
    context 'with sufficient balance' do
      it 'deducts credits from user balance' do
        expect {
          CreditTransactionService.deduct_credits(user, 500, call)
        }.to change { user.reload.credit_balance_cents }.by(-500)
      end

      it 'creates a transaction record' do
        expect {
          CreditTransactionService.deduct_credits(user, 500, call)
        }.to change(CreditTransaction, :count).by(1)

        transaction = CreditTransaction.last
        expect(transaction.amount_cents).to eq(-500)
        expect(transaction.transaction_type).to eq('call_charge')
        expect(transaction.metadata['call_id']).to eq(call.id)
      end

      it 'returns true' do
        expect(CreditTransactionService.deduct_credits(user, 500, call)).to be true
      end
    end

    context 'with insufficient balance' do
      it 'does not deduct credits' do
        expect {
          CreditTransactionService.deduct_credits(user, 1500, call)
        }.not_to change { user.reload.credit_balance_cents }
      end

      it 'does not create a transaction record' do
        expect {
          CreditTransactionService.deduct_credits(user, 1500, call)
        }.not_to change(CreditTransaction, :count)
      end

      it 'returns false' do
        expect(CreditTransactionService.deduct_credits(user, 1500, call)).to be false
      end
    end
  end

  describe '.refund_credits' do
    let(:original_transaction) { create(:credit_transaction, user: user, amount_cents: -500) }

    it 'adds credits back to user balance' do
      original_transaction # Create the transaction before the expect block
      expect {
        CreditTransactionService.refund_credits(user, 500, original_transaction)
      }.to change { user.reload.credit_balance_cents }.by(500)
    end

    it 'creates a refund transaction record' do
      original_transaction # Create the transaction before the expect block
      expect {
        CreditTransactionService.refund_credits(user, 500, original_transaction)
      }.to change(CreditTransaction, :count).by(1)

      transaction = CreditTransaction.last
      expect(transaction.amount_cents).to eq(500)
      expect(transaction.transaction_type).to eq('refund')
      expect(transaction.metadata['original_transaction_id']).to eq(original_transaction.id)
    end
  end
end
