require 'webmock/rspec'

RSpec.configure do |config|
  config.before(:each) do
    # Stub for Stripe Customer create
    stub_request(:post, "https://api.stripe.com/v1/customers")
      .to_return(
        status: 200,
        body: {
          id: "cus_test123",
          object: "customer",
          email: "test@example.com"
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end
end 