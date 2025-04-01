FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    password { 'password' }
    paying_customer { false }
    credit_balance_cents { 0 }
    timezone { 'UTC' }
    
    trait :with_credits do
      credit_balance_cents { 5000 }
    end
    
    trait :admin do
      admin { true }
    end
    
    trait :us_timezone do
      timezone { 'America/New_York' }
    end
    
    trait :eu_timezone do
      timezone { 'Europe/London' }
    end
  end
end
