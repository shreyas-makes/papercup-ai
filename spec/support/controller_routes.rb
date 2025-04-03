RSpec.configure do |config|
  config.before(:each, type: :controller) do
    # This ensures that controller tests have access to routes
    # Essential for controllers in namespaces like Users::OmniauthCallbacksController
    @routes = Rails.application.routes
  end
end 