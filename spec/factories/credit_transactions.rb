FactoryBot.define do
  factory :credit_transaction do
    association :user
    amount_cents { 5000 }
    transaction_type { 'deposit' }
    description { 'Credit purchase' }
    
    trait :deposit do
      transaction_type { 'deposit' }
      amount_cents { 5000 }
      description { 'Credit purchase' }
    end
    
    trait :call do
      transaction_type { 'call' }
      amount_cents { -500 }
      description { 'Call to +1234567890' }
    end
  end
end
