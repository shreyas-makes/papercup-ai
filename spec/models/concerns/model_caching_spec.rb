require 'rails_helper'

RSpec.describe ModelCaching do
  describe 'caching methods' do
    let(:user) { create(:user) }
    
    # Apply the concern to User for testing
    before(:all) do
      User.include(ModelCaching) unless User.included_modules.include?(ModelCaching)
    end
    
    describe '.cached_find' do
      it 'uses cache for finding records' do
        allow(Rails.cache).to receive(:fetch).and_call_original
        
        User.cached_find(user.id)
        
        expect(Rails.cache).to have_received(:fetch).with(/user\/#{user.id}/, any_args)
      end
    end
    
    describe '.cached_count' do
      it 'uses cache for counting records' do
        allow(Rails.cache).to receive(:fetch).and_call_original
        
        User.cached_count
        
        expect(Rails.cache).to have_received(:fetch).with(/user\/count/, any_args)
      end
    end
    
    describe '.cached_sum' do
      it 'uses cache for summing columns' do
        allow(Rails.cache).to receive(:fetch).and_call_original
        
        User.cached_sum(:credit_balance_cents)
        
        expect(Rails.cache).to have_received(:fetch).with(/user\/sum\/credit_balance_cents/, any_args)
      end
    end
    
    describe '#cached_association' do
      it 'uses cache for associations' do
        allow(Rails.cache).to receive(:fetch).and_call_original
        # Mock an association method
        allow(user).to receive(:calls).and_return([])
        
        user.cached_association(:calls)
        
        expect(Rails.cache).to have_received(:fetch).with(/#{user.cache_key}\/calls/, any_args)
      end
    end
  end
end 