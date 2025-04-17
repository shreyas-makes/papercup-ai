import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

/**
 * Active call controller for handling call state and UI
 */
export default class extends Controller {
  static targets = ["timer", "status", "phoneNumber", "credits", "overlay", "callState", "callButton", "hangupButton"]
  static values = {
    state: { type: String, default: "idle" }, // idle, connecting, ringing, active, ended
    duration: { type: Number, default: 0 },
    phoneNumber: String,
    countryCode: String,
    callId: String,
    callDuration: { type: Number, default: 0 },
    statusPollInterval: { type: Number, default: 3000 },
    activeStateDuration: { type: Number, default: 0 } // Track how long we've been in active state
  }

  // Timer reference for call duration
  #callTimer = null
  // Timer reference for status polling
  #statusPollTimer = null

  // Add hideTimeout property to the class
  hideTimeout = null;

  connect() {
    console.log("Active call controller connected", this.element)
    console.log("CONTROLLER DIAGNOSTIC: # of active-call controllers:", document.querySelectorAll('[data-controller~="active-call"]').length);

    this.timerInterval = null
    this.statusPollingInterval = null
    this.endingCall = false
    this.hideTimeout = null; // Initialize on connect
    
    console.log("Available targets:", {
      timer: this.hasTimerTarget,
      status: this.hasStatusTarget,
      phoneNumber: this.hasPhoneNumberTarget,
      credits: this.hasCreditsTarget,
      overlay: this.hasOverlayTarget,
      callState: this.hasCallStateTarget,
      callButton: this.hasCallButtonTarget,
      hangupButton: this.hasHangupButtonTarget
    })

    // Log all events for debugging
    document.addEventListener('papercup:call-started', (e) => console.log('Call started event:', e.detail))
    document.addEventListener('papercup:call-ended', (e) => console.log('Call ended event:', e.detail))
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
    
    // Listen for redial events from call history
    document.addEventListener('call-history:redial', this.handleRedial.bind(this))
  }

  disconnect() {
    this.stopTimer()
    this.stopStatusPolling()
    
    // If we're in the middle of ending a call, make sure we hide the screen
    if (this.endingCall || this.stateValue === 'ended') {
      // Clear any pending hide timeouts before potentially calling hideCallScreen again
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.hideCallScreen()
    }
    
    // Clear timeout on disconnect
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    
    // Clean up event listeners
    document.removeEventListener('call-history:redial', this.handleRedial.bind(this))
    document.removeEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
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
      console.log("@@@ Test: About to log result object");
      console.log("Call initiated with result:", result)
      console.log("@@@ Test: Execution reached AFTER logging result.");

      /*
      if (result && result.id) {
        this.callIdValue = result.id
        // Keep in connecting state but start polling for status
        console.log(`@@@ startCall: About to call startStatusPolling with ID: ${result.id}`);
        this.startStatusPolling(result.id)

        // Dispatch call started event
        document.dispatchEvent(new CustomEvent('papercup:call-started', {
          detail: {
            callId: result.id,
            phoneNumber: this.phoneNumberValue,
            countryCode: this.countryCodeValue
          }
        }))
      }
      */
      
      console.log("@@@ Test: Execution reached END of try block.");

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
   * Handle a call history redial event
   */
  handleRedial(event) {
    const { phoneNumber, countryCode } = event.detail
    this.startCall(phoneNumber, countryCode)
  }
  
  /**
   * Start polling for call status updates
   * @param {string} callId - The ID of the call to monitor
   */
  startStatusPolling(callId) {
    // Clear any existing polling interval
    this.stopStatusPolling()
    
    console.log("Starting status polling for call ID:", callId);
    
    // Start polling every 2 seconds
    console.log("@@@ About to create setInterval for polling.");
    this.statusPollingInterval = setInterval(async () => {
      console.log(`@@@ Polling interval running for Call ID: ${callId}. Current state: ${this.stateValue}, endingCall: ${this.endingCall}`);

      // *** ADD CHECK: If we are already in the process of ending the call, stop polling and ignore ***
      if (this.endingCall) {
        console.log("Polling interval: endingCall is true, stopping polling and ignoring status.");
        this.stopStatusPolling();
        return;
      }

      try {
        console.log(`@@@ Polling: Attempting api.getCallStatus(${callId})`);
        const callData = await api.getCallStatus(callId)
        console.log("@@@ Polling: Received callData:", callData);
        
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
            'terminated': 'ended',
            'canceled': 'ended',
            'no-answer': 'ended',
            'busy': 'ended',
            'error': 'ended'
          }
          
          const uiStatus = statusMap[callData.status] || callData.status
          console.log("Mapping status:", callData.status, "to UI status:", uiStatus)
          
          // Update UI with new status
          this.updateCallState(uiStatus)
          
          // If call has ended, dispatch call-ended event which will close the modal
          if (uiStatus === 'ended' || callData.status === 'completed' || 
              callData.status === 'failed' || callData.status === 'terminated' ||
              callData.status === 'canceled' || callData.status === 'busy' ||
              callData.status === 'no-answer' || callData.status === 'error') {
            console.log("Polling detected 'ended' status. Stopping polling and triggering call-ended event.");
            
            // IMPORTANT: Dispatch call-ended event to close the modal
            document.dispatchEvent(new CustomEvent('papercup:call-ended', {
              detail: {
                callId: this.callIdValue,
                status: callData.status
              }
            }));
            
            this.stopStatusPolling()
          }
          
          // NEW: If the call has been in active state for too long, check with Twilio directly
          if (uiStatus === 'active') {
            this.activeStateDurationValue += 2; // Add 2 seconds (our polling interval)
            
            // After 8 seconds in active state, use the direct Twilio status check
            if (this.activeStateDurationValue >= 8 && callData.twilio_sid) {
              console.log("Call has been in active state for more than 8 seconds, checking Twilio directly");
              
              try {
                const directStatusData = await api.getDirectTwilioStatus(callData.twilio_sid);
                console.log("Direct Twilio status check returned:", directStatusData);
                
                // If Twilio says the call is complete but our backend doesn't know yet
                if (directStatusData.status === 'completed' || 
                    directStatusData.status === 'failed' || 
                    directStatusData.status === 'no-answer' ||
                    directStatusData.status === 'canceled' ||
                    directStatusData.status === 'busy') {
                  
                  console.log("Twilio reports call is ended, but our backend didn't update. Forcing end state.");
                  
                  // Force call to ended state
                  this.updateCallState("ended");
                  
                  // Trigger call ended event
                  document.dispatchEvent(new CustomEvent('papercup:call-ended', {
                    detail: {
                      callId: this.callIdValue,
                      status: directStatusData.status,
                      source: 'direct_twilio_check'
                    }
                  }));
                  
                  this.stopStatusPolling();
                }
              } catch (directError) {
                console.error("Error checking direct Twilio status:", directError);
              }
            }
          } else {
            // Reset the counter if we're not in active state
            this.activeStateDurationValue = 0;
          }
        }
      } catch (error) {
        console.error("@@@ Polling: Error caught in interval:", error);
        console.error("@@@ Polling: Stopping polling due to error.");
        this.stopStatusPolling();
      }
    }, 2000)
  }
  
  /**
   * Stop polling for call status
   */
  stopStatusPolling() {
    console.log("stopStatusPolling called"); // Add log
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval)
      this.statusPollingInterval = null
      console.log("Polling interval cleared."); // Add log
    }
  }
  
  /**
   * End the current call
   */
  async endCall() {
    console.log("@@@ endCall invoked. Current state:", this.stateValue, " endingCall:", this.endingCall, " Call ID:", this.callIdValue);
    
    // Prevent multiple clicks
    if (this.endingCall) {
      console.log("endCall already in progress, ignoring click")
      return
    }
    
    // Disable the hangup button immediately
    if (this.hasHangupButtonTarget) {
      this.hangupButtonTarget.disabled = true
      this.hangupButtonTarget.classList.add("opacity-50", "cursor-not-allowed")
    }

    this.stopTimer()
    this.stopStatusPolling()
    
    // Mark that we're in the process of ending a call
    this.endingCall = true
    
    // Set state to ended immediately for UI feedback
    this.updateCallState("ended")

    // Only call the API if we have a call ID
    if (this.callIdValue) {
      try {
        console.log("@@@ Calling api.endCall for ID:", this.callIdValue);
        const result = await api.endCall(this.callIdValue)
        console.log("Call ended with result:", result)

        // Dispatch call ended event
        document.dispatchEvent(new CustomEvent('papercup:call-ended', {
          detail: {
            callId: this.callIdValue,
            duration: this.callDurationValue
          }
        }))

        // Also dispatch the general call status changed event
        document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
          detail: {
            callId: this.callIdValue,
            status: 'ended',
            duration: this.callDurationValue
          }
        }))
      } catch (error) {
        console.error("Error ending call:", error)
        // If ending fails, still attempt to hide the screen
      }
    }
    
    // Always hide the call screen after attempting to end the call
    // Use a single, reliable call to hideCallScreen
    this.hideCallScreen();
  }
  
  /**
   * Hide the call screen overlay
   */
  hideCallScreen() {
    console.log("hideCallScreen called - current state:", this.stateValue, " endingCall:", this.endingCall);

    // If already hidden, exit
    if (this.hasOverlayTarget && this.overlayTarget.classList.contains("hidden")) {
        console.log("hideCallScreen: Overlay already hidden.");
        return;
    }

    // Re-enable hangup button
    if (this.hasHangupButtonTarget) {
      this.hangupButtonTarget.disabled = false;
      this.hangupButtonTarget.classList.remove("opacity-50", "cursor-not-allowed");
    }

    if (this.hasOverlayTarget) {
      console.log("hideCallScreen: Starting IMMEDIATE hide process. Current classes:", this.overlayTarget.className);
      
      // Clear any potentially existing timeout 
      if (this.hideTimeout) {
        console.log("hideCallScreen: Clearing existing hide timeout.")
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }

      // --- DEBUGGING: Hide immediately without transition --- 
      this.overlayTarget.classList.remove("opacity-100"); // Remove opacity just in case
      this.overlayTarget.classList.add("hidden");       // Add hidden immediately
      console.log("          >>> AFTER adding hidden. Classes:", this.overlayTarget.className);
      // Log computed style immediately after adding the class
      const computedStyle = window.getComputedStyle(this.overlayTarget);
      console.log("          >>> Computed display style:", computedStyle.display);
      console.log("          >>> Computed opacity style:", computedStyle.opacity);
      // --- END DEBUGGING --- 

      // Reset state immediately since hiding is immediate
      this.durationValue = 0;
      if (this.stateValue === 'ended') {
          this.updateCallState("idle");
      } else {
          console.log("hideCallScreen: State is no longer 'ended', not setting to 'idle'. Current state:", this.stateValue);
      }
      this.callIdValue = "";
      this.endingCall = false; // Reset flag 

      console.log("hideCallScreen: Immediate hide process complete.");

      /* --- ORIGINAL TIMEOUT LOGIC (Commented out) ---
      // 1. Remove opacity to trigger fade-out
      //this.overlayTarget.classList.remove("opacity-100");
      //console.log("hideCallScreen: Removed opacity-100. Classes:", this.overlayTarget.className);

      // 2. Set timeout to add hidden class after transition duration
      //this.hideTimeout = setTimeout(() => {
      //  console.log("hideCallScreen: Timeout triggered. Adding hidden class.");
      //  this.overlayTarget.classList.add("hidden");

      //  // Reset state *after* hiding
      //  this.durationValue = 0;
      //  if (this.stateValue === 'ended') {
      //      this.updateCallState("idle");
      //  } else {
      //      console.log("hideCallScreen: State is no longer 'ended', not setting to 'idle'. Current state:", this.stateValue);
      //  }
      //  this.callIdValue = "";
      //  this.endingCall = false; // Reset flag *after* successful hide

      //  console.log("hideCallScreen: Process complete. Final classes:", this.overlayTarget.className);
      //  this.hideTimeout = null; // Clear timeout reference
      //}, 250); // Use transition duration (e.g., 250ms)
      */
      // --- END ORIGINAL TIMEOUT LOGIC ---

    } else {
      console.error("overlay target not found in hideCallScreen");
      this.endingCall = false; // Reset flag even if target not found
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
        
        // IMPORTANT FIX: Ensure polling is always started when state becomes active
        if (this.callIdValue && !this.statusPollingInterval) {
          console.log("POLLING FIX: Ensuring polling is started for active call with ID:", this.callIdValue);
          this.startStatusPolling(this.callIdValue);
        }
      } else if (state === "ended") {
        this.statusTarget.classList.add("text-red-500")
        // Stop the timer when call ends
        this.stopTimer()
      } else if (state === "idle" && this.hasOverlayTarget && !this.overlayTarget.classList.contains("hidden")) {
        // If state is idle but overlay is still visible, hide it
        this.hideCallScreen()
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

  handleCallStatusChanged(event) {
    console.log("@@@ handleCallStatusChanged triggered. Event detail:", event.detail); // ADDED LOG
    const status = event.detail?.status; // Use optional chaining
    console.log("@@@ handleCallStatusChanged: Extracted status:", status); // ADDED LOG
    console.log("@@@ handleCallStatusChanged: Current endingCall flag:", this.endingCall); // ADDED LOG

    // If the call has ended externally (e.g., via polling),
    // ensure we hide the call screen if the user hasn't already clicked the end button.
    if ((status === 'ended' || status === 'terminated' || status === 'completed' || status === 'failed') 
        && !this.endingCall) {
      console.log("@@@ handleCallStatusChanged: Conditions MET. Detected external call end, triggering hideCallScreen."); // ADDED LOG
      // Mark that we're ending the call to prevent conflicts
      this.endingCall = true 
      this.hideCallScreen()
    } else {
      console.log("@@@ handleCallStatusChanged: Conditions NOT MET."); // ADDED LOG
    }
  }

  /**
   * State value changed
   */
  stateValueChanged(value) {
    console.log("Call state value changed:", value)
    
    // If state changes to idle but the overlay is still visible, hide it
    if (value === "idle" && this.hasOverlayTarget && 
        !this.overlayTarget.classList.contains("hidden")) {
      console.log("State changed to idle but overlay still visible - hiding")
      this.hideCallScreen()
    }
  }
}