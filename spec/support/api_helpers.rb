module ApiHelpers
  def sign_in_as(user)
    post "/login", params: { user: { email: user.email, password: "password" } }
    follow_redirect! if response.redirect?
  end
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request
end
