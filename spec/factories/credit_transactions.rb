FactoryBot.define do
  factory :credit_transaction do
    association :user
    amount_cents { 1000 }
    transaction_type { %w[deposit withdrawal call_charge refund].sample }
    stripe_payment_id { "pi_#{SecureRandom.hex(12)}" }
    
    trait :deposit do
      transaction_type { 'deposit' }
      stripe_payment_id { "py_#{SecureRandom.hex(10)}" }
    end
    
    trait :withdrawal do
      transaction_type { 'withdrawal' }
    end
    
    trait :refund do
      transaction_type { 'refund' }
    end
    
    trait :call_charge do
      transaction_type { 'call_charge' }
      amount_cents { rand(50..500) }
    end
  end
end
