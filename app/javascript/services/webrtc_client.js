// WebRTC client for Papercup
// Currently using only STUN servers for NAT traversal
// No TURN server relaying is implemented at this stage

export default class WebRTCClient {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callActive = false;
  }

  // Initialize the WebRTC connection
  async initialize() {
    try {
      // Get the WebRTC configuration from the server
      const response = await fetch('/api/webrtc/token');
      if (!response.ok) throw new Error('Failed to get WebRTC configuration');
      
      const data = await response.json();
      const { token, config } = data;
      
      // Initialize the peer connection with STUN servers
      this.peerConnection = new RTCPeerConnection(config);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      return true;
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      return false;
    }
  }

  // Request user media (microphone)
  async requestUserMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Add tracks to the peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      return true;
    } catch (error) {
      console.error('Error getting user media:', error);
      return false;
    }
  }

  // Set up event handlers for the peer connection
  setupEventHandlers() {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the candidate to the server
        this.sendIceCandidate(event.candidate);
      }
    };
    
    // Log connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      
      // Handle disconnections
      if (this.peerConnection.connectionState === 'disconnected' || 
          this.peerConnection.connectionState === 'failed') {
        this.handleDisconnection();
      }
    };
    
    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      
      // Monitor for connection issues that might indicate STUN-only limitations
      if (this.peerConnection.iceConnectionState === 'failed') {
        console.warn('ICE connection failed - may need TURN servers in the future');
      }
    };
    
    // Handle incoming tracks (audio)
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      // Connect the remote stream to audio output
      this.handleRemoteStream();
    };
  }

  // Start a call
  async startCall(callId) {
    try {
      if (!this.peerConnection) await this.initialize();
      if (!this.localStream) await this.requestUserMedia();
      
      // Create an offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true
      });
      
      // Set local description
      await this.peerConnection.setLocalDescription(offer);
      
      // Send the offer to the server
      const response = await fetch(`/api/calls/${callId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify({ offer: this.peerConnection.localDescription })
      });
      
      if (!response.ok) throw new Error('Failed to send offer');
      
      this.callActive = true;
      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      return false;
    }
  }

  // End the call
  async endCall(callId) {
    try {
      if (!this.callActive) return true;
      
      // Close the peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }
      
      // Stop all tracks in the local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Notify the server that the call has ended
      const response = await fetch(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        }
      });
      
      if (!response.ok) throw new Error('Failed to end call on server');
      
      this.callActive = false;
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }

  // Helper to handle remote stream
  handleRemoteStream() {
    if (!this.remoteStream) return;
    
    // Create or get audio element for remote audio
    let remoteAudio = document.getElementById('remote-audio');
    if (!remoteAudio) {
      remoteAudio = document.createElement('audio');
      remoteAudio.id = 'remote-audio';
      remoteAudio.autoplay = true;
      document.body.appendChild(remoteAudio);
    }
    
    // Connect the remote stream
    remoteAudio.srcObject = this.remoteStream;
  }

  // Helper to handle disconnection
  handleDisconnection() {
    console.log('Call disconnected');
    // Cleanup connection
    this.callActive = false;
  }

  // Send ICE candidate to the server
  async sendIceCandidate(candidate) {
    try {
      const response = await fetch('/api/webrtc/ice_candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify({ candidate })
      });
      
      if (!response.ok) throw new Error('Failed to send ICE candidate');
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  }

  // Get CSRF token from meta tag
  getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }
} 