FactoryBot.define do
  factory :call do
    association :user
    phone_number { "+1#{Faker::Number.number(digits: 10)}" }
    country_code { "US" }
    start_time { Time.current }
    duration_seconds { rand(60..600) }
    status { "pending" }
    cost_cents { 0 }
    
    trait :completed do
      status { "completed" }
      duration_seconds { rand(30..300) }
      cost_cents { rand(50..500) }
    end
    
    trait :failed do
      status { "failed" }
    end
  end
end
