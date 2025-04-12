FactoryBot.define do
  factory :credit_package do
    sequence(:name) { |n| "Package #{n}" }
    sequence(:identifier) { |n| "package_#{n}" }
    description { "A great credit package" }
    amount_cents { 10000 }
    price_cents { 2000 }
    
    trait :starter do
      name { 'Starter' }
      identifier { 'starter' }
      amount_cents { 5000 }
      price_cents { 1000 }
      description { 'Perfect for occasional callers' }
    end
    
    trait :standard do
      name { 'Standard' }
      identifier { 'standard' }
      amount_cents { 15000 }
      price_cents { 2500 }
      description { 'Most popular choice' }
    end
    
    trait :premium do
      name { 'Premium' }
      identifier { 'premium' }
      amount_cents { 35000 }
      price_cents { 5000 }
      description { 'For frequent callers' }
    end
  end
end
