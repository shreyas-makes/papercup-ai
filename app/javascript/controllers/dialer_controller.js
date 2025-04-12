import { Controller } from "@hotwired/stimulus"
import api from "../services/api"
import webrtc from "../services/webrtc"
import CallChannel from "../channels/call_channel"

/**
 * Dialer controller for making and managing calls
 */
export default class extends Controller {
  static targets = ["phoneNumber", "countryCode", "callButton", "endCallButton", "status", "timer"]
  // Define outlets for the phone-input and active-call controllers
  static outlets = [ "phone-input", "active-call", "dialer" ]

  connect() {
    // Initialize state
    this.isCallActive = false
    this.callStartTime = null
    this.timerInterval = null
    this.callSubscription = null
    
    // Set default country code
    this.countryCodeTarget.value = "+1"
  }

  disconnect() {
    // Clean up resources
    this.endCall()
  }
  
  // Handle call button click
  async call(event) {
    event.preventDefault()
    
    if (this.isCallActive) {
      return
    }
    
    const phoneNumber = this.phoneNumberTarget.value.trim()
    const countryCode = this.countryCodeTarget.value
    
    if (!phoneNumber) {
      this.showError("Please enter a phone number")
      return
    }
    
    try {
      // Disable call button and show loading state
      this.showLoading(this.callButtonTarget)
      
      // Start call
      await this.startCall(phoneNumber, countryCode)
    } catch (error) {
      this.showError("Failed to start call. Please try again later.")
      console.error("Error starting call:", error)
    } finally {
      this.hideLoading(this.callButtonTarget)
    }
  }
  
  // Start a new call
  async startCall(phoneNumber, countryCode) {
    try {
      // Update UI
      this.updateCallState("initializing")
      
      // Start WebRTC call
      await webrtc.initiateCall(
        phoneNumber,
        countryCode,
        this.handleCallStateChange.bind(this),
        this.handleCallError.bind(this)
      )
      
      // Subscribe to call channel
      this.subscribeToCallChannel(webrtc.callId)
      
      // Update UI
      this.isCallActive = true
      this.callStartTime = new Date()
      this.startTimer()
      this.updateCallState("connected")
    } catch (error) {
      this.handleCallError(error)
      throw error
    }
  }
  
  // End the current call
  async endCall() {
    if (!this.isCallActive) {
      return
    }
    
    try {
      // Update UI
      this.updateCallState("ending")
      
      // End WebRTC call
      await webrtc.endCall()
      
      // Unsubscribe from call channel
      this.unsubscribeFromCallChannel()
      
      // Update UI
      this.isCallActive = false
      this.stopTimer()
      this.updateCallState("ended")
    } catch (error) {
      console.error("Error ending call:", error)
    }
  }
  
  // Handle call state change
  handleCallStateChange(state) {
    this.updateCallState(state)
  }
  
  // Handle call error
  handleCallError(error) {
    console.error("Call error:", error)
    this.showError("Call error: " + (error.message || "Unknown error"))
    this.endCall()
  }
  
  // Subscribe to call channel
  subscribeToCallChannel(callId) {
    if (this.callSubscription) {
      this.unsubscribeFromCallChannel()
    }
    
    this.callSubscription = CallChannel.subscribe(callId, {
      onStateChange: this.handleCallStateChange.bind(this),
      onIceCandidate: (candidate) => {
        // Handle ICE candidate
        if (webrtc.peerConnection) {
          webrtc.peerConnection.addIceCandidate(candidate)
        }
      },
      onCallEnded: (reason) => {
        this.showError("Call ended: " + reason)
        this.endCall()
      }
    })
  }
  
  // Unsubscribe from call channel
  unsubscribeFromCallChannel() {
    if (this.callSubscription) {
      CallChannel.unsubscribe(this.callSubscription)
      this.callSubscription = null
    }
  }
  
  // Update call state
  updateCallState(state) {
    if (this.statusTarget) {
      this.statusTarget.textContent = this.getStateMessage(state)
    }
    
    // Update button states
    if (this.callButtonTarget) {
      this.callButtonTarget.disabled = this.isCallActive
    }
    
    if (this.endCallButtonTarget) {
      this.endCallButtonTarget.disabled = !this.isCallActive
    }
  }
  
  // Get state message
  getStateMessage(state) {
    switch (state) {
      case "initializing":
        return "Initializing call..."
      case "connecting":
        return "Connecting..."
      case "connected":
        return "Call in progress"
      case "ending":
        return "Ending call..."
      case "ended":
        return "Call ended"
      case "error":
        return "Call error"
      default:
        return "Ready"
    }
  }
  
  // Start timer
  startTimer() {
    this.stopTimer()
    
    this.timerInterval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now - this.callStartTime) / 1000)
      
      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      
      if (this.timerTarget) {
        this.timerTarget.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }
    }, 1000)
  }
  
  // Stop timer
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    
    if (this.timerTarget) {
      this.timerTarget.textContent = "00:00"
    }
  }
  
  // Show loading state
  showLoading(element) {
    element.classList.add("opacity-50")
    element.disabled = true
    
    // Add loading spinner if not already present
    if (!element.querySelector(".loading-spinner")) {
      const spinner = document.createElement("div")
      spinner.className = "loading-spinner"
      spinner.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `
      element.appendChild(spinner)
    }
  }
  
  // Hide loading state
  hideLoading(element) {
    element.classList.remove("opacity-50")
    element.disabled = false
    
    // Remove loading spinner
    const spinner = element.querySelector(".loading-spinner")
    if (spinner) {
      spinner.remove()
    }
  }
  
  // Show error message
  showError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.querySelector(".error-message")
    if (!errorElement) {
      errorElement = document.createElement("div")
      errorElement.className = "error-message fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
      document.body.appendChild(errorElement)
    }
    
    // Set error message
    errorElement.textContent = message
    
    // Show error
    errorElement.classList.remove("hidden")
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorElement.classList.add("hidden")
    }, 5000)
  }
} 