Sidekiq.configure_server do |config|
  config.redis = { url: 'redis://localhost:6381/1' }
end

Sidekiq.configure_client do |config|
  config.redis = { url: 'redis://localhost:6381/1' }
end 