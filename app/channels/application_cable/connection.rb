module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
      logger.add_tags "ActionCable", "User #{current_user.id}"
    end

    private

    def find_verified_user
      # Assumes Devise is used and user is logged in via warden in the session/cookie
      # Adjust this logic if using token-based auth (e.g., from headers or params)
      if verified_user = env['warden'].user
        verified_user
      else
        reject_unauthorized_connection
      end
    end
  end
end
