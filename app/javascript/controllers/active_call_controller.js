import { Controller } from "@hotwired/stimulus"

/**
 * Active call screen controller for handling call state and UI
 */
export default class extends Controller {
  static targets = ["timer", "status", "phoneNumber", "credits", "overlay"]
  static values = {
    state: { type: String, default: "idle" }, // idle, connecting, active, ended
    duration: { type: Number, default: 0 },
    phoneNumber: String,
    countryCode: String
  }

  connect() {
    console.log("Active call controller connected", this.element)
    this.timerInterval = null
    // Debug logs
    console.log("Overlay target exists:", this.hasOverlayTarget)
    if (this.hasOverlayTarget) {
      console.log("Overlay element:", this.overlayTarget)
    }
  }

  disconnect() {
    this.stopTimer()
  }

  /**
   * Start a call with the given phone number
   * @param {string} phoneNumber - The phone number to call
   * @param {string} countryCode - The country code
   */
  startCall(phoneNumber, countryCode) {
    console.log("startCall called with:", phoneNumber, countryCode)
    this.phoneNumberValue = phoneNumber
    this.countryCodeValue = countryCode
    
    if (this.hasPhoneNumberTarget) {
      this.phoneNumberTarget.textContent = `${countryCode} ${phoneNumber}`
    } else {
      console.error("phoneNumber target not found")
    }
    
    // Show the call overlay
    if (this.hasOverlayTarget) {
      console.log("Showing overlay")
      // Make the overlay visible
      this.overlayTarget.classList.remove("hidden")
      // Trigger fade-in animation
      setTimeout(() => {
        this.overlayTarget.classList.add("opacity-100")
      }, 10)
    } else {
      console.error("overlay target not found")
    }
    
    // Start with connecting state
    this.updateCallState("connecting")
    
    // After a mock delay, transition to active state
    setTimeout(() => {
      this.updateCallState("active")
      this.startTimer()
    }, 2500)
  }
  
  /**
   * End the current call
   */
  endCall() {
    console.log("endCall called")
    this.stopTimer()
    this.updateCallState("ended")
    
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
    console.log("updateCallState called with:", state)
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
      } else if (state === "ended") {
        this.statusTarget.classList.add("text-red-500")
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
      
      // Update credits display with mock decreasing value
      if (this.hasCreditsTarget && this.durationValue % 10 === 0) {
        const currentCredit = parseFloat(this.creditsTarget.textContent.replace('$', ''))
        const newCredit = (currentCredit - 0.10).toFixed(2)
        this.creditsTarget.textContent = `$${newCredit}`
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