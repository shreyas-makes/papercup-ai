import { Controller } from "@hotwired/stimulus"
import { authApi, callApi, creditApi } from "../services/mockApi"

/**
 * Dialer controller for handling dialer functionality
 */
export default class extends Controller {
  static targets = ["input"]
  // Define outlets for the phone-input and active-call controllers
  static outlets = [ "phone-input", "active-call", "dialer" ]

  connect() {
    console.log("Dialer controller connected", this.element)
    console.log("Active call controller connected to dialer outlet:", this.hasDialerOutlet)
    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyPress.bind(this))
    // Add event listener for redial from call history
    this.element.addEventListener("call-history:redial", this.handleRedial.bind(this))
    
    // Listen for state updates from application controller
    document.addEventListener('papercup:state-update', this.handleStateUpdate.bind(this))

    // Manually connect to active call controller by ID
    setTimeout(() => {
      const activeCallEl = document.getElementById('active-call-controller');
      if (activeCallEl) {
        const controller = this.application.getControllerForElementAndIdentifier(activeCallEl, 'active-call');
        if (controller) {
          this.activeCallController = controller;
          console.log("Manually connected to active call controller");
        }
      }
    }, 100);
  }

  disconnect() {
    // Clean up keyboard event listener
    document.removeEventListener("keydown", this.handleKeyPress.bind(this))
    // Clean up redial event listener
    this.element.removeEventListener("call-history:redial", this.handleRedial.bind(this))
    // Clean up state update listener
    document.removeEventListener('papercup:state-update', this.handleStateUpdate.bind(this))
  }
  
  // State management
  handleStateUpdate(event) {
    // Store the state for later use
    this.authenticated = event.detail.authenticated
    this.creditBalance = event.detail.creditBalance
    this.callStatus = event.detail.callStatus
    
    // If we just became authenticated and have a pending call
    if (this.authenticated !== event.detail.authenticated && event.detail.authenticated) {
      const pendingCall = localStorage.getItem('pending_call')
      if (pendingCall) {
        const { phoneNumber, countryCode } = JSON.parse(pendingCall)
        this._executeCall(phoneNumber, countryCode)
      }
    }
  }
  
  // Optional: Callback when the outlet connects
  phoneInputOutletConnected(outlet, element) {
    console.log("Phone input outlet connected:", outlet, element)
  }
  
  // Callback when active-call outlet connects
  activeCallOutletConnected(outlet, element) {
    console.log("Active call outlet connected:", outlet, element)
    console.log("Outlet available methods:", Object.keys(outlet))
    console.log("Outlet element:", element)
    console.log("Outlet startCall exists:", typeof outlet.startCall === 'function')
  }

  /**
   * Handle keyboard events for the dialer
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyPress(event) {
    // Only handle if the input is focused
    if (!this.inputTarget.matches(':focus')) return

    const key = event.key
    
    // Handle number keys (0-9)
    if (/^[0-9]$/.test(key)) {
      event.preventDefault()
      this.simulateKeyPress(key)
    }
    // Handle special keys (*, #)
    else if (key === '*' || key === '#') {
      event.preventDefault()
      this.simulateKeyPress(key)
    }
  }

  /**
   * Simulate a key press by creating a synthetic event
   * @param {string} key - The key to simulate
   */
  simulateKeyPress(key) {
    // Create a synthetic event
    const event = new Event('click', { bubbles: true })
    // Find the corresponding button
    const button = this.element.querySelector(`[data-dialer-key="${key}"]`)
    if (button) {
      // Add the key to the button's dataset
      button.dataset.dialerKey = key
      // Trigger the click event
      button.dispatchEvent(event)
    }
  }

  /**
   * Add a key press to the input field
   * @param {Event} event - The click event
   */
  addKey(event) {
    console.log("--- dialer#addKey START ---")
    console.log("addKey called with:", event.currentTarget.dataset.dialerKey)
    event.preventDefault()

    const key = event.currentTarget.dataset.dialerKey
    const input = this.inputTarget
    
    // Add the key to the input value
    const cursorPos = input.selectionStart || input.value.length
    input.value = [input.value.slice(0, cursorPos), key, input.value.slice(cursorPos)].join('')
    input.setSelectionRange(cursorPos + 1, cursorPos + 1)
    input.focus()

    // Validate input through outlet if available
    if (this.hasPhoneInputOutlet) {
      console.log("Validating via phoneInputOutlet")
      this.phoneInputOutlet.handleInput()
    } else {
      console.warn("Phone input outlet not connected - using fallback validation")
      this.fallbackInputValidation()
    }
    console.log("--- dialer#addKey END ---")
  }

  // Add new fallback validation method
  fallbackInputValidation() {
    const input = this.inputTarget
    const isValid = input.value.length >= 7 && input.value.length <= 15
    
    if (!isValid) {
      input.classList.add("border-red-500")
    } else {
      input.classList.remove("border-red-500")
    }
  }

  /**
   * Clear the input field
   */
  clear() {
    this.inputTarget.value = ""
    // Ensure state is updated after clearing via outlet
    if (this.hasPhoneInputOutlet) {
      this.phoneInputOutlet.handleInput()
    } else {
      console.error("phoneInputOutlet is not connected in clear")
    }
  }

  /**
   * Initiate a call with the entered phone number
   * @param {Event} event - The click event
   */
  async initiateCall(event) {
    event.preventDefault()
    console.log("--- dialer#initiateCall START ---")
    console.log("AUTH STATE:", { 
      localStorageAuth: localStorage.getItem('papercup_auth'),
      authValue: localStorage.getItem('papercup_auth') === 'true'
    })

    // Get the phone number from the input
    const phoneNumber = this.inputTarget.value.replace(/\D/g, "")
    const countryCode = this.element.querySelector('[data-country-selector-target="selectedCode"]')?.textContent || ""
    
    // Validate phone number length
    if (phoneNumber.length < 7 || phoneNumber.length > 15) {
      console.error("Invalid phone number length")
      document.dispatchEvent(new CustomEvent('papercup:show-notification', {
        detail: { 
          type: 'warning',
          title: 'Invalid Number',
          message: "Please enter a valid phone number" 
        }
      }))
      return
    }
    
    // Check if user is authenticated directly from localStorage
    const isAuthenticated = localStorage.getItem('papercup_auth') === 'true';
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store pending call data
      localStorage.setItem('papercup_pending_call', JSON.stringify({
        phoneNumber,
        countryCode,
        timestamp: Date.now()
      }));
      
      // Listen for login event once
      const loginSuccessHandler = async () => {
        console.log("LOGIN SUCCESS HANDLER TRIGGERED");
        document.removeEventListener('papercup:login-success', loginSuccessHandler);
        
        // Get the pending call data
        const pendingCallData = localStorage.getItem('papercup_pending_call');
        console.log("Retrieved pending call data:", pendingCallData);
        
        if (pendingCallData) {
          try {
            const pendingCall = JSON.parse(pendingCallData);
            console.log("Processing pending call:", pendingCall);
            
            // IMPORTANT: Clear pending call data BEFORE executing
            localStorage.removeItem('papercup_pending_call');
            
            // Execute the call directly without timeout
            console.log("Executing stored call after login");
            await this.executeCall(pendingCall.phoneNumber, pendingCall.countryCode);
          } catch (error) {
            console.error("Error processing pending call:", error);
          }
        }
      };
      
      document.addEventListener('papercup:login-success', loginSuccessHandler);
      
      // Show login modal
      document.dispatchEvent(new CustomEvent('papercup:show-modal', {
        detail: { id: 'login-modal' }
      }))
      return
    }
    
    // Get credit balance from localStorage
    const creditBalance = parseFloat(localStorage.getItem('papercup_mock_credits') || '0');
    
    // Check credit balance
    if (creditBalance < 1) {
      document.dispatchEvent(new CustomEvent('papercup:show-notification', {
        detail: { 
          type: 'warning',
          title: 'Insufficient Credits',
          message: "Insufficient credits to make a call. Please add more credits." 
        }
      }))
      return
    }
    
    // If we get here, user is authenticated and has credits
    await this.executeCall(phoneNumber, countryCode);
  }

  /**
   * Execute the call after all validations pass
   * @param {string} phoneNumber - The phone number to call
   * @param {string} countryCode - The country code
   */
  async executeCall(phoneNumber, countryCode) {
    try {
      console.log("Executing call to:", phoneNumber, countryCode)
      
      // Use the global active call controller directly
      const activeCallEl = document.getElementById('active-call-controller');
      if (activeCallEl) {
        const controller = this.application.getControllerForElementAndIdentifier(
          activeCallEl, 'active-call'
        );
        if (controller) {
          console.log("Starting call in UI with global controller")
          controller.startCall(phoneNumber, countryCode)
        } else {
          console.error("Active call controller not found on element")
        }
      } else {
        console.error("Active call element not found in DOM")
      }
      
      // Start the call in the API immediately (no setTimeout)
      console.log("Calling API to start call")
      const response = await callApi.startCall(phoneNumber, countryCode)
      console.log("Call API response:", response)
      
      // Update call status in global state
      document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
        detail: { status: 'active', callId: response.callId }
      }))
      
      console.log("Call initiated successfully:", response)
    } catch (error) {
      console.error("Error initiating call:", error)
      
      // Hide the call UI if it was shown
      const activeCallEl = document.getElementById('active-call-controller');
      if (activeCallEl) {
        const controller = this.application.getControllerForElementAndIdentifier(
          activeCallEl, 'active-call'
        );
        if (controller && controller.hideCallScreen) {
          controller.hideCallScreen();
        }
      }
      
      document.dispatchEvent(new CustomEvent('papercup:show-notification', {
        detail: { 
          type: 'error',
          title: 'Call Failed',
          message: error.message || "Failed to initiate call" 
        }
      }))
    }
  }

  // New fallback API method
  async directCallApi(phoneNumber, countryCode) {
    console.log("Using direct API fallback")
    const response = await callApi.startCall(phoneNumber, countryCode)
    document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
      detail: { status: 'active', callId: response.callId }
    }))
    return response
  }

  // Add outlet initialization method
  async initializeActiveCallOutlet() {
    return new Promise((resolve) => {
      const checkOutlet = () => {
        if (this.hasActiveCallOutlet) {
          console.log("Active call outlet now connected")
          resolve()
        } else {
          setTimeout(checkOutlet, 50)
        }
      }
      checkOutlet()
    })
  }

  /**
   * Handle redial event from call history
   * @param {CustomEvent} event - The redial event with phone number details
   */
  handleRedial(event) {
    console.log("--- dialer#handleRedial START ---")
    const { phoneNumber, countryCode } = event.detail
    
    // Set the phone number in the input field
    this.inputTarget.value = phoneNumber
    
    // Find the country selector and update it if available
    const countrySelector = document.querySelector('[data-controller="country-selector"]')
    if (countrySelector) {
      const countrySelectorController = this.application.getControllerForElementAndIdentifier(
        countrySelector, 
        "country-selector"
      )
      
      if (countrySelectorController && typeof countrySelectorController.selectCountryByCode === 'function') {
        countrySelectorController.selectCountryByCode(countryCode)
      }
    }
    
    // Update validation via phone-input outlet
    if (this.hasPhoneInputOutlet) {
      this.phoneInputOutlet.handleInput()
    }
    
    // Focus the input field
    this.inputTarget.focus()
    console.log("--- dialer#handleRedial END ---")
  }
} 