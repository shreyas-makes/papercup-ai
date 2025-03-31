module NotificationHelper
  # Render low balance warning banner
  def render_low_balance_banner
    render partial: 'shared/notifications/low_balance_banner'
  end
  
  # Render error notification toast
  # @param message [String] The error message to display
  # @param error_type [String] Type of error (network, invalid_number, insufficient_credits, permissions)
  # @param action_text [String] Optional text for action button
  # @param action_url [String] Optional URL for action button
  def render_error_notification(message, error_type = nil, action_text = nil, action_url = nil)
    render partial: 'shared/notifications/error_notification', locals: {
      message: message,
      error_type: error_type,
      action_text: action_text,
      action_url: action_url
    }
  end
  
  # Render success notification toast
  # @param message [String] The success message to display
  def render_success_notification(message)
    render partial: 'shared/notifications/success_notification', locals: {
      message: message
    }
  end
  
  # Render skeleton loader
  # @param type [String] Type of skeleton loader (dialer, country_selector, credit_update)
  # @param container_class [String] Additional CSS classes for container
  # @param count [Integer] Number of elements for generic skeleton
  # @param height [Integer] Height of elements for generic skeleton
  def render_skeleton_loader(type = nil, container_class = '', count = 3, height = 10)
    render partial: 'shared/loaders/skeleton_loader', locals: {
      type: type,
      container_class: container_class,
      count: count,
      height: height
    }
  end
  
  # Render call connecting loader
  # @param show_cancel_button [Boolean] Whether to show the cancel button
  def render_call_connecting_loader(show_cancel_button = true)
    render partial: 'shared/loaders/call_connecting', locals: {
      show_cancel_button: show_cancel_button
    }
  end
end 