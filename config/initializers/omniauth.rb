# Remove the entire OmniAuth::Builder block since Devise handles this
# Rails.application.config.middleware.use OmniAuth::Builder do
#   provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET']
# end

# Only keep the security settings
OmniAuth.config.allowed_request_methods = [:post]

# Configure OmniAuth to use relative path
# OmniAuth.config.path_prefix = "/users/auth"

# Add error handling
OmniAuth.config.on_failure = Proc.new do |env|
  OmniAuth::FailureEndpoint.new(env).redirect_to_failure
end 