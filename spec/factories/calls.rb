FactoryBot.define do
  factory :call do
    association :user
    phone_number { '+1234567890' }
    country_code { 'US' }
    status { 'initiated' }
    duration_seconds { 0 }
    cost_cents { 0 }
    
    trait :ongoing do
      status { 'ongoing' }
      started_at { Time.current }
    end
    
    trait :completed do
      status { 'completed' }
      started_at { 5.minutes.ago }
      ended_at { Time.current }
      duration_seconds { 300 }
      cost_cents { 150 }
    end
    
    trait :failed do
      status { 'failed' }
      failure_reason { 'Network error' }
    end
  end
end
