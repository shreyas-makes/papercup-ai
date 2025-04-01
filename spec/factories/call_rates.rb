FactoryBot.define do
  factory :call_rate do
    country_code { %w[US CA GB FR DE].sample }
    sequence(:prefix) { |n| "#{('A'..'Z').to_a.sample}#{n}" }
    rate_per_min_cents { rand(10..500) }
  end
end
