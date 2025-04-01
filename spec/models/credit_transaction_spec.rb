require 'rails_helper'

RSpec.describe CreditTransaction, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'monetize' do
    it { should monetize(:amount_cents).as(:amount) }
  end

  describe 'validations' do
    it { should validate_presence_of(:transaction_type) }
    it { should validate_presence_of(:amount_cents) }
    
    it { should validate_inclusion_of(:transaction_type).in_array(CreditTransaction::TYPES) }
    
    it "validates that amount_cents cannot be zero" do
      transaction = build(:credit_transaction, amount_cents: 0)
      expect(transaction).not_to be_valid
      expect(transaction.errors[:amount_cents]).to include("must be other than 0")
    end
  end
  
  describe 'constants' do
    it 'defines valid transaction types' do
      expect(CreditTransaction::TYPES).to match_array(['deposit', 'withdrawal', 'refund', 'call_charge'])
    end
  end
end
