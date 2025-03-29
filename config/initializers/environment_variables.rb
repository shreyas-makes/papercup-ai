# Load environment variables from .env file if present
if Rails.env.development? || Rails.env.test?
  env_file = Rails.root.join('.env')
  if File.exist?(env_file)
    require 'dotenv'
    Dotenv.load(env_file)
  end
end

# Define a utility method to check for required environment variables
def ensure_env_vars_present(*vars)
  missing = vars.select { |var| ENV[var].blank? }
  
  if missing.any?
    message = "Required environment variables missing: #{missing.join(', ')}"
    
    if Rails.env.development?
      # Just log in development
      Rails.logger.warn message
    else
      # Raise an error in production
      raise message
    end
  end
end

# Check for essential environment variables
if Rails.env.production?
  ensure_env_vars_present(
    'DATABASE_URL',
    'REDIS_URL',
    'RAILS_MASTER_KEY'
  )
end 