class CallChannel < ApplicationCable::Channel
  # Called when a client subscribes to the channel
  def subscribed
    # stream_from "some_channel"
    # Ensure the user is authenticated before allowing subscription
    return reject unless current_user

    # Stream updates specifically for this user
    stream_for current_user

    # Optional: Track connection state using WebRtcConnectionService
    # WebRtcConnectionService.track_connection(current_user.id, connection.id) # Need a unique connection ID

    Rails.logger.info "[ActionCable] User #{current_user.id} subscribed to CallChannel"
  end

  # Called when a client unsubscribes or disconnects
  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    # Optional: Update connection state
    # WebRtcConnectionService.handle_disconnect(connection.id) # Need a unique connection ID

    Rails.logger.info "[ActionCable] User #{current_user&.id} unsubscribed from CallChannel"
  end

  # Example action: Receiving a signaling message from the client
  # Client would call: App.cable.subscriptions.subscriptions[0].perform('signal', { data: '...' })
  def signal(data)
    # TODO: Process the signaling message (e.g., offer, answer, ICE candidate)
    # Requires identifying the target user/call session
    target_user_id = data['target_user_id'] # Example structure
    signal_data = data['signal_data']

    if target_user_id && signal_data
      target_user = User.find_by(id: target_user_id)
      if target_user
        # Broadcast the signal to the target user's channel
        CallChannel.broadcast_to(
          target_user,
          { type: 'signal', sender_id: current_user.id, signal_data: signal_data }
        )
        Rails.logger.info "[ActionCable] Relayed signal from User #{current_user.id} to User #{target_user_id}"
      else
        Rails.logger.warn "[ActionCable] Signal target user #{target_user_id} not found."
        # Optionally send an error back to the sender
      end
    else
      Rails.logger.warn "[ActionCable] Received invalid signal data from User #{current_user.id}: #{data.inspect}"
    end
  end

  # Example action: Initiating a call
  def initiate_call(data)
    # TODO: Implement call initiation logic
    # - Use CallRoutingService to determine how to connect
    # - If WebRTC -> WebRTC, send signaling offer via this channel
    # - If WebRTC -> PSTN, use TwilioService
    # - Manage call state (e.g., in Redis or a database model)
    destination = data['destination'] # e.g., another user ID or a phone number
    Rails.logger.info "[ActionCable] User #{current_user.id} initiating call to #{destination}"

    # Placeholder: Just broadcast back for now
    broadcast_to(current_user, { type: 'call_status', status: 'initiating', destination: destination })
  end

  # TODO: Add more actions for call control (answer, hangup, hold, etc.)
end
