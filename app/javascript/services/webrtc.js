// WebRTC Service for Papercup
// Handles browser-side WebRTC functionality

import api from './api';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onCallStateChange = null;
    this.onError = null;
    this.callId = null;
    
    // STUN servers configuration
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers here for production
      ],
    };
  }
  
  /**
   * Initialize a new call
   * @param {string} phoneNumber - The phone number to call
   * @param {string} countryCode - The country code
   * @param {Function} onStateChange - Callback for call state changes
   * @param {Function} onError - Callback for errors
   */
  async initiateCall(phoneNumber, countryCode, onStateChange, onError) {
    try {
      this.onCallStateChange = onStateChange;
      this.onError = onError;
      
      // Update call state
      this.updateCallState('initializing');
      
      // Get WebRTC token from server
      const { token, call_id } = await api.getWebRTCToken();
      this.callId = call_id;
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);
      
      // Set up event handlers
      this.setupPeerConnectionHandlers();
      
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      // Create and set local description
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      // Initiate call on server
      const response = await api.initiateCall(phoneNumber, countryCode);
      
      // Update call state
      this.updateCallState('connecting');
      
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Set up event handlers for the peer connection
   */
  setupPeerConnectionHandlers() {
    // ICE candidate event
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to server
        // This would be implemented with a real-time connection
      }
    };
    
    // Connection state change
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      this.updateCallState(state);
    };
    
    // Track event (remote stream)
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.updateCallState('connected');
    };
  }
  
  /**
   * Update the call state and notify listeners
   * @param {string} state - The new call state
   */
  updateCallState(state) {
    if (this.onCallStateChange) {
      this.onCallStateChange(state);
    }
  }
  
  /**
   * Handle errors and notify listeners
   * @param {Error} error - The error that occurred
   */
  handleError(error) {
    console.error('WebRTC error:', error);
    if (this.onError) {
      this.onError(error);
    }
    this.updateCallState('error');
  }
  
  /**
   * End the current call
   */
  async endCall() {
    try {
      if (this.callId) {
        await api.endCall(this.callId);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      this.cleanup();
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    // Reset state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callId = null;
    
    // Update call state
    this.updateCallState('ended');
  }
}

export default new WebRTCService(); 