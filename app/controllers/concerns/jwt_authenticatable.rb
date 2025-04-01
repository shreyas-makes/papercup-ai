module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_jwt!
  end

  private

  def authenticate_jwt!
    return if current_user

    header = request.headers['Authorization']
    return head :unauthorized unless header

    token = header.split(' ').last
    payload = JwtService.decode(token)
    return head :unauthorized unless payload

    @current_user = User.find_by(id: payload['user_id'])
    head :unauthorized unless @current_user
  end

  def current_user
    @current_user ||= super
  rescue NoMethodError
    nil
  end

  def signed_in?
    !!current_user
  end
end 