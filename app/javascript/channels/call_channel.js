import consumer from "./consumer";

// CallChannel for real-time call updates
const CallChannel = {
  // Subscribe to the call channel
  subscribe: (callId, callbacks) => {
    return consumer.subscriptions.create(
      { channel: "CallChannel", call_id: callId },
      {
        connected() {
          console.log(`Connected to CallChannel for call ${callId}`);
        },
        
        disconnected() {
          console.log(`Disconnected from CallChannel for call ${callId}`);
        },
        
        received(data) {
          console.log(`Received data on CallChannel for call ${callId}:`, data);
          
          // Handle different types of updates
          switch (data.type) {
            case 'call_state_change':
              if (callbacks.onStateChange) {
                callbacks.onStateChange(data.state);
              }
              break;
              
            case 'ice_candidate':
              if (callbacks.onIceCandidate) {
                callbacks.onIceCandidate(data.candidate);
              }
              break;
              
            case 'call_ended':
              if (callbacks.onCallEnded) {
                callbacks.onCallEnded(data.reason);
              }
              break;
              
            default:
              console.warn(`Unknown update type: ${data.type}`);
          }
        },
      }
    );
  },
  
  // Unsubscribe from the call channel
  unsubscribe: (subscription) => {
    if (subscription) {
      subscription.unsubscribe();
    }
  },
};

export default CallChannel; 