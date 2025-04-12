FactoryBot.define do
  factory :credit_package do
    sequence(:name) { |n| "Package #{n}" }
    sequence(:description) { |n| "Description for Package #{n}" }
    amount_cents { 1000 }
    price_cents { 1000 }
    active { true }

    trait :inactive do
      active { false }
    end

    trait :large do
      name { "Large Package" }
      description { "Perfect for heavy users" }
      amount_cents { 5000 }
      price_cents { 4500 }
    end

    trait :premium do
      name { "Premium Package" }
      description { "Our best value package" }
      amount_cents { 10000 }
      price_cents { 9000 }
    end
  end
end
