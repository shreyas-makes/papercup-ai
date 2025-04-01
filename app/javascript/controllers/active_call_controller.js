import { Controller } from "@hotwired/stimulus"
import { callApi, creditApi } from "../services/mockApi"

/**
 * Active call screen controller for handling call state and UI
 */
export default class extends Controller {
  static targets = ["timer", "status", "phoneNumber", "credits", "overlay"]
  static values = {
    state: { type: String, default: "idle" }, // idle, connecting, active, ended
    duration: { type: Number, default: 0 },
    phoneNumber: String,
    countryCode: String,
    callId: String
  }

  connect() {
    console.log("Active call controller connected", this.element)
    this.timerInterval = null
    // Debug logs
    console.log("Overlay target exists:", this.hasOverlayTarget)
    if (this.hasOverlayTarget) {
      console.log("Overlay element:", this.overlayTarget)
    }
    
    // Listen for global state updates
    document.addEventListener('papercup:state-update', this.handleStateUpdate.bind(this))
    
    // Listen for direct call status changes
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }

  disconnect() {
    this.stopTimer()
    document.removeEventListener('papercup:state-update', this.handleStateUpdate.bind(this))
    document.removeEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }
  
  /**
   * Handle global state updates
   */
  handleStateUpdate(event) {
    const { callStatus } = event.detail
    
    // Only react if the call status has changed
    if (callStatus && callStatus !== this.stateValue) {
      this.updateCallState(callStatus)
    }
  }
  
  /**
   * Handle call status change events
   */
  handleCallStatusChanged(event) {
    const { status, callId } = event.detail
    
    if (status === 'active' && callId) {
      this.callIdValue = callId
    }
    
    this.updateCallState(status)
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
      this.phoneNumberTarget.textContent = `${countryCode} ${phoneNumber}`
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
    
    // Now callApi.startCall will be called by the dialer controller
    // so we don't need to make the API call here, just react to state changes
  }
  
  /**
   * End the current call
   */
  async endCall() {
    console.log("endCall called")
    this.stopTimer()
    this.updateCallState("ended")
    
    // Only call the API if we have a call ID
    if (this.callIdValue) {
      try {
        const result = await callApi.endCall(this.callIdValue)
        console.log("Call ended with result:", result)
        
        // Update credit balance in global state
        document.dispatchEvent(new CustomEvent('papercup:credits-updated', {
          detail: { credits: result.remainingCredits }
        }))
        
        // Update call status in global state
        document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
          detail: { status: 'ended' }
        }))
      } catch (error) {
        console.error("Error ending call:", error)
        document.dispatchEvent(new CustomEvent('papercup:show-notification', {
          detail: { 
            type: 'error',
            title: 'Call Error',
            message: error.message || "Error ending call" 
          }
        }))
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
    console.group("[ACTIVE CALL] State Update")
    console.log("Previous state:", this.stateValue)
    console.log("New state:", state)
    console.log("Call ID:", this.callIdValue)
    console.log("Overlay visible:", this.overlayTarget?.classList.contains('hidden'))
    
    this.stateValue = state
    
    if (this.hasStatusTarget) {
      const statusText = {
        idle: "",
        connecting: "Connecting...",
        active: "Connected",
        ended: "Call ended"
      }
      
      this.statusTarget.textContent = statusText[state] || ""
      
      // Update status appearance based on state
      this.statusTarget.classList.remove("text-green-500", "text-amber-500", "text-red-500")
      
      if (state === "connecting") {
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
    } else {
      console.error("status target not found")
    }

    console.groupEnd()
  }
  
  /**
   * Start the call timer
   */
  startTimer() {
    console.log("startTimer called")
    this.durationValue = 0
    this.updateTimerDisplay()
    
    this.timerInterval = setInterval(async () => {
      this.durationValue += 1
      this.updateTimerDisplay()
      
      // Fetch updated credit balance every 10 seconds
      if (this.durationValue % 10 === 0) {
        try {
          const response = await creditApi.getBalance()
          
          if (this.hasCreditsTarget) {
            this.creditsTarget.textContent = `$${response.credits.toFixed(2)}`
          }
          
          // Update global credit balance
          document.dispatchEvent(new CustomEvent('papercup:credits-updated', {
            detail: { credits: response.credits }
          }))
          
          // Check for low balance
          if (response.credits < 2) {
            document.dispatchEvent(new CustomEvent('papercup:show-notification', {
              detail: { 
                type: 'warning',
                title: 'Low Balance',
                message: "Your credit balance is getting low. The call will end when you run out of credits." 
              }
            }))
          }
          
          // End call if credits are depleted
          if (response.credits <= 0) {
            document.dispatchEvent(new CustomEvent('papercup:show-notification', {
              detail: { 
                type: 'warning',
                title: 'Call Ended',
                message: "Call ended: You've run out of credits." 
              }
            }))
            this.endCall()
          }
        } catch (error) {
          console.error("Error updating credit balance:", error)
        }
      }
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
   * Update the timer display with formatted duration
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
   * Test method to toggle the call screen (for development)
   */
  toggleTestCall() {
    console.log("toggleTestCall called. Current state:", this.stateValue)
    if (this.stateValue === "idle") {
      // Start a test call with mock data
      this.startCall("555-123-4567", "+1")
    } else {
      // End the current call
      this.endCall()
    }
  }
}