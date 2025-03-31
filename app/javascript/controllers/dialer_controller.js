import { Controller } from "@hotwired/stimulus"
import { authApi, callApi, creditApi } from "../services/mockApi"

/**
 * Dialer controller for handling dialer functionality
 */
export default class extends Controller {
  static targets = ["input"]
  // Define outlets for the phone-input and active-call controllers
  static outlets = [ "phone-input", "active-call" ]

  connect() {
    console.log("Dialer controller connected", this.element)
    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyPress.bind(this))
    // Add event listener for redial from call history
    this.element.addEventListener("call-history:redial", this.handleRedial.bind(this))
    
    // Listen for state updates from application controller
    document.addEventListener('papercup:state-update', this.handleStateUpdate.bind(this))
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
  }
  
  // Optional: Callback when the outlet connects
  phoneInputOutletConnected(outlet, element) {
    console.log("Phone input outlet connected:", outlet, element)
  }
  
  // Callback when active-call outlet connects
  activeCallOutletConnected(outlet, element) {
    console.log("Active call outlet connected:", outlet, element)
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
    event.preventDefault() // Prevent default button behavior

    const key = event.currentTarget.dataset.dialerKey
    const input = this.inputTarget
    
    // Add the key to the input value at the current cursor position
    const cursorPos = input.selectionStart || input.value.length
    const before = input.value.substring(0, cursorPos)
    const after = input.value.substring(cursorPos)
    input.value = before + key + after
    
    // Set the cursor position after the inserted character
    const newCursorPos = cursorPos + 1
    input.setSelectionRange(newCursorPos, newCursorPos)
    
    // Force focus on the input
    input.focus()
    
    // --- Use Outlet for Communication --- 
    if (this.hasPhoneInputOutlet) {
      console.log("Calling handleInput via phoneInputOutlet")
      this.phoneInputOutlet.handleInput()
    } else {
      console.error("phoneInputOutlet is not connected in addKey")
    }
    // --- End Outlet Communication ---
    console.log("--- dialer#addKey END ---")
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

    // Get the phone number from the input
    const phoneNumber = this.inputTarget.value.replace(/\D/g, "")
    
    // Validate phone number length
    if (phoneNumber.length < 7 || phoneNumber.length > 15) {
      console.error("Invalid phone number length")
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Please enter a valid phone number" }
      }))
      return
    }
    
    // Check if user is authenticated
    if (!this.authenticated) {
      // Show login modal
      document.dispatchEvent(new CustomEvent('papercup:show-modal', {
        detail: { id: 'login-modal' }
      }))
      return
    }
    
    // Check credit balance
    if (this.creditBalance < 1) {
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Insufficient credits to make a call. Please add more credits." }
      }))
      return
    }

    try {
      // Get the selected country code from the country selector
      const countryCode = this.element.querySelector('[data-country-selector-target="selectedCode"]').textContent
      const formattedNumber = this.inputTarget.value
      
      // Using the active-call controller to handle the call UI
      if (this.hasActiveCallOutlet) {
        this.activeCallOutlet.startCall(formattedNumber, countryCode)
      } else {
        console.error("activeCallOutlet is not connected in initiateCall")
      }
      
      // Use mock API instead of actual fetch call
      const response = await callApi.startCall(phoneNumber, countryCode)
      
      // Update call status in the global state
      document.dispatchEvent(new CustomEvent('papercup:call-status-changed', {
        detail: { status: 'active', callId: response.callId }
      }))
      
      console.log("Call initiated successfully:", response)

    } catch (error) {
      console.error("Failed to initiate call:", error)
      // End the call UI if there was an API error
      if (this.hasActiveCallOutlet) {
        this.activeCallOutlet.endCall()
      }
      
      // Show error message to user
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: error.message || "Failed to initiate call" }
      }))
    }

    console.log("--- dialer#initiateCall END ---")
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