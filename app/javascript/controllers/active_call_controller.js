import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

/**
 * Active call controller for handling call state and UI
 */
export default class extends Controller {
  static targets = ["timer", "status", "phoneNumber", "credits", "overlay"]
  static values = {
    state: { type: String, default: "idle" }, // idle, connecting, ringing, active, ended
    duration: { type: Number, default: 0 },
    phoneNumber: String,
    countryCode: String,
    callId: String
  }

  connect() {
    console.log("Active call controller connected", this.element)
    this.timerInterval = null
    this.statusPollingInterval = null
    console.log("Available targets:", {
      timer: this.hasTimerTarget,
      status: this.hasStatusTarget,
      phoneNumber: this.hasPhoneNumberTarget,
      credits: this.hasCreditsTarget,
      overlay: this.hasOverlayTarget
    })
  }

  disconnect() {
    this.stopTimer()
    this.stopStatusPolling()
  }

  /**
   * Start a call with the given phone number
   * @param {string} phoneNumber - The phone number to call
   * @param {string} countryCode - The country code
   */
  async startCall(phoneNumber, countryCode) {
    console.log("### ACTIVE CALL - startCall called with:", phoneNumber, countryCode)
    this.phoneNumberValue = phoneNumber
    this.countryCodeValue = countryCode
    
    if (this.hasPhoneNumberTarget) {
      this.phoneNumberTarget.textContent = phoneNumber
    } else {
      console.error("phoneNumber target not found")
    }
    
    // Show the call overlay
    if (this.hasOverlayTarget) {
      console.log("### ACTIVE CALL - Showing overlay")
      // Make the overlay visible
      this.overlayTarget.classList.remove("hidden")
      // Trigger fade-in animation
      setTimeout(() => {
        this.overlayTarget.classList.add("opacity-100")
      }, 10)
    } else {
      console.error("### ACTIVE CALL - overlay target not found")
    }
    
    // Start with connecting state
    this.updateCallState("connecting")
    
    // Make the actual API call to initiate the call
    try {
      console.log("Calling API.initiateCall with:", phoneNumber, countryCode)
      const result = await api.initiateCall(phoneNumber, countryCode)
      console.log("Call initiated with result:", result)
      
      if (result && result.id) {
        this.callIdValue = result.id
        // Keep in connecting state but start polling for status
        this.startStatusPolling(result.id)
        // Show notification that call is being connected
        alert("Call initiated! Connecting to your phone...")
      }
    } catch (error) {
      console.error("Error initiating call:", error)
      this.updateCallState("ended")
      // Show error notification
      alert("Error initiating call: " + (error.message || "Unknown error"))
      
      // Hide the call screen after a short delay
      setTimeout(() => {
        this.hideCallScreen()
      }, 1500)
    }
  }
  
  /**
   * Start polling for call status updates
   * @param {string} callId - The ID of the call to monitor
   */
  startStatusPolling(callId) {
    // Clear any existing polling interval
    this.stopStatusPolling()
    
    // Start polling every 2 seconds
    this.statusPollingInterval = setInterval(async () => {
      try {
        const callData = await api.getCallStatus(callId)
        console.log("Call status update:", callData)
        
        if (callData && callData.status) {
          // Map the API status to our UI status
          const statusMap = {
            'initiated': 'connecting',
            'in_progress': 'ringing',
            'ringing': 'ringing',
            'answered': 'active',
            'in_call': 'active',
            'completed': 'ended',
            'failed': 'ended',
            'terminated': 'ended'
          }
          
          const uiStatus = statusMap[callData.status] || callData.status
          console.log("Mapping status:", callData.status, "to UI status:", uiStatus)
          
          // Update UI with new status
          this.updateCallState(uiStatus)
          
          // If call has ended, stop polling and hide after delay
          if (uiStatus === 'ended') {
            this.stopStatusPolling()
            setTimeout(() => {
              this.hideCallScreen()
            }, 1500)
          }
        }
      } catch (error) {
        console.error("Error polling call status:", error)
      }
    }, 2000)
  }
  
  /**
   * Stop polling for call status
   */
  stopStatusPolling() {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval)
      this.statusPollingInterval = null
    }
  }
  
  /**
   * End the current call
   */
  async endCall() {
    console.log("endCall called")
    this.stopTimer()
    this.stopStatusPolling()
    this.updateCallState("ended")
    
    // Only call the API if we have a call ID
    if (this.callIdValue) {
      try {
        const result = await api.endCall(this.callIdValue)
        console.log("Call ended with result:", result)
      } catch (error) {
        console.error("Error ending call:", error)
      }
    }
    
    // After showing the ended state briefly, hide the call screen
    setTimeout(() => {
      this.hideCallScreen()
    }, 1500)
  }
  
  /**
   * Hide the call screen overlay
   */
  hideCallScreen() {
    console.log("hideCallScreen called")
    if (this.hasOverlayTarget) {
      // Trigger fade-out animation
      this.overlayTarget.classList.remove("opacity-100")
      
      // After animation completes, hide the element
      setTimeout(() => {
        this.overlayTarget.classList.add("hidden")
        // Reset state
        this.durationValue = 0
        this.updateCallState("idle")
        this.callIdValue = ""
      }, 200)
    } else {
      console.error("overlay target not found in hideCallScreen")
    }
  }
  
  /**
   * Update the call state and UI
   * @param {string} state - The new call state
   */
  updateCallState(state) {
    console.log("[ACTIVE CALL] State Update:", state)
    console.log("- Previous state:", this.stateValue)
    console.log("- Call ID:", this.callIdValue)
    
    this.stateValue = state
    
    if (this.hasStatusTarget) {
      const statusText = {
        idle: "",
        connecting: "Connecting...",
        ringing: "Ringing...",
        active: "Connected",
        ended: "Call ended"
      }
      
      this.statusTarget.textContent = statusText[state] || ""
      
      // Update status appearance based on state
      this.statusTarget.classList.remove("text-green-500", "text-amber-500", "text-red-500")
      
      if (state === "connecting" || state === "ringing") {
        this.statusTarget.classList.add("text-amber-500")
      } else if (state === "active") {
        this.statusTarget.classList.add("text-green-500")
        
        // Start the timer when call becomes active
        if (!this.timerInterval) {
          this.startTimer()
        }
      } else if (state === "ended") {
        this.statusTarget.classList.add("text-red-500")
        // Stop the timer when call ends
        this.stopTimer()
      }
      
      // Add pulsing animation for active call
      if (state === "active") {
        this.statusTarget.classList.add("animate-pulse")
      } else {
        this.statusTarget.classList.remove("animate-pulse")
      }
      
      // Dispatch event for other controllers
      document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
        detail: { status: state, callId: this.callIdValue }
      }))
    } else {
      console.error("status target not found")
    }
  }
  
  /**
   * Start the call timer
   */
  startTimer() {
    console.log("startTimer called")
    this.durationValue = 0
    this.updateTimerDisplay()
    
    this.timerInterval = setInterval(() => {
      this.durationValue += 1
      this.updateTimerDisplay()
    }, 1000)
  }
  
  /**
   * Stop the call timer
   */
  stopTimer() {
    console.log("stopTimer called")
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }
  
  /**
   * Update the timer display
   */
  updateTimerDisplay() {
    if (this.hasTimerTarget) {
      const minutes = Math.floor(this.durationValue / 60)
      const seconds = this.durationValue % 60
      this.timerTarget.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
    } else {
      console.error("timer target not found")
    }
  }
  
  /**
   * For testing the call UI
   */
  toggleTestCall() {
    if (this.stateValue === "idle") {
      this.startCall("+447741993282", "GB")
    } else {
      this.endCall()
    }
  }
}