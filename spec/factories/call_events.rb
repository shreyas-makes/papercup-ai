FactoryBot.define do
  factory :call_event do
    call { nil }
    event_type { "MyString" }
    occurred_at { "2025-04-03 20:47:07" }
    metadata { "" }
  end
end
