FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'password123' }
    password_confirmation { 'password123' }
    name { "Test User" }
    paying_customer { false }
    credit_balance_cents { 1000 }
    confirmed_at { Time.current }
    timezone { 'UTC' }
    
    # Add traits for OmniAuth users
    trait :google_oauth do
      provider { 'google_oauth2' }
      uid { '123456789' }
      image { 'https://lh3.googleusercontent.com/test/photo.jpg' }
    end
    
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
    
    trait :with_stripe do
      stripe_customer_id { "cus_#{SecureRandom.hex(12)}" }
    end
  end
end
