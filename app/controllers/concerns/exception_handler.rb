module ExceptionHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound do |e|
      json_response({ error: e.message }, :not_found)
    end

    rescue_from ActiveRecord::RecordInvalid do |e|
      json_response({ error: e.message }, :unprocessable_entity)
    end
    
    rescue_from JWT::DecodeError do |e|
      json_response({ error: 'Invalid token' }, :unauthorized)
    end
    
    rescue_from JWT::ExpiredSignature do |e|
      json_response({ error: 'Token has expired' }, :unauthorized)
    end
  end
end 