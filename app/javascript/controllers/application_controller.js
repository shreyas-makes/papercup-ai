import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

/**
 * Global application controller
 * Manages authentication, credit balance, and UI state
 */
export default class extends Controller {
  static values = {
    authenticated: { type: Boolean, default: false },
    credits: { type: Number, default: 0 },
    callInProgress: { type: Boolean, default: false },
    callStatus: { type: String, default: 'idle' }
  }
  
  static targets = ["notificationContainer"]
  
  connect() {
    // Listen for global events
    document.addEventListener('papercup:login', this.handleLogin.bind(this))
    document.addEventListener('papercup:logout', this.handleLogout.bind(this))
    document.addEventListener('papercup:call-started', this.handleCallStarted.bind(this))
    document.addEventListener('papercup:call-ended', this.handleCallEnded.bind(this))
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
    document.addEventListener('papercup:credits-updated', this.handleCreditsUpdated.bind(this))
    document.addEventListener('papercup:show-notification', this.handleShowNotification.bind(this))
    document.addEventListener('papercup:show-modal', this.handleShowModal.bind(this))
    document.addEventListener('papercup:hide-modal', this.handleHideModal.bind(this))
    
    // Check initial auth state
    this.checkAuthState()
    
    console.log("Application controller connected", this.element)
    
    // Broadcast initial state for other controllers
    this.broadcastState()
  }
  
  disconnect() {
    document.removeEventListener('papercup:login', this.handleLogin.bind(this))
    document.removeEventListener('papercup:logout', this.handleLogout.bind(this))
    document.removeEventListener('papercup:call-started', this.handleCallStarted.bind(this))
    document.removeEventListener('papercup:call-ended', this.handleCallEnded.bind(this))
    document.removeEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
    document.removeEventListener('papercup:credits-updated', this.handleCreditsUpdated.bind(this))
    document.removeEventListener('papercup:show-notification', this.handleShowNotification.bind(this))
    document.removeEventListener('papercup:show-modal', this.handleShowModal.bind(this))
    document.removeEventListener('papercup:hide-modal', this.handleHideModal.bind(this))
  }
  
  /**
   * Broadcast state to other controllers
   */
  broadcastState() {
    document.dispatchEvent(new CustomEvent('papercup:state-update', {
      detail: {
        authenticated: this.authenticatedValue,
        creditBalance: this.creditsValue,
        callStatus: this.callStatusValue
      }
    }))
  }
  
  /**
   * Check initial authentication state
   */
  async checkAuthState() {
    try {
      // Check if user has a valid auth token
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Call the real API to verify token
          const response = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Auth state:", data);
            this.authenticatedValue = true;
            
            // Make sure credit balance is valid
            let balance = 0;
            
            // Try to get credit_balance_cents first, then fall back to credit_balance
            if (data.user) {
              if (data.user.credit_balance_cents !== undefined) {
                // Convert cents to dollars
                balance = parseFloat(data.user.credit_balance_cents) / 100;
              } else if (data.user.credit_balance !== undefined) {
                if (typeof data.user.credit_balance === 'object' && data.user.credit_balance !== null) {
                  // It's a Money object
                  if (data.user.credit_balance.cents !== undefined) {
                    balance = parseFloat(data.user.credit_balance.cents) / 100;
                  } else if (data.user.credit_balance.amount !== undefined) {
                    balance = parseFloat(data.user.credit_balance.amount);
                  }
                } else {
                  // Try to parse as number
                  balance = parseFloat(data.user.credit_balance);
                }
              }
              
              // Validate that it's a proper number
              if (isNaN(balance)) {
                console.error("Invalid balance value:", data.user.credit_balance_cents || data.user.credit_balance);
                balance = 0;
              }
            }
            
            console.log("Setting credit balance to:", balance);
            this.creditsValue = balance;
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            this.authenticatedValue = false;
            this.creditsValue = 0;
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          this.authenticatedValue = false;
          this.creditsValue = 0;
        }
      } else {
        this.authenticatedValue = false;
        this.creditsValue = 0;
      }
      
      // Broadcast updated state
      this.broadcastState();
    } catch (error) {
      console.error('Failed to check auth state:', error);
    }
  }
  
  /**
   * Handle successful login
   */
  handleLogin(event) {
    console.log("Login event received, fetching balance...")
    this.authenticatedValue = true
    
    // Fetch balance after login
    api.getBalance().then(data => {
      console.log("Fetched balance after login:", data.balance)
      
      // Validate balance value
      let balance = 0;
      if (data.balance !== undefined && data.balance !== null) {
        balance = parseFloat(data.balance);
        if (isNaN(balance)) {
          console.error("Invalid balance value from API:", data.balance);
          balance = 0;
        }
      }
      
      console.log("Setting validated balance value:", balance);
      this.creditsValue = balance;
      this.broadcastState();
    }).catch(error => {
      console.error("Error fetching balance after login:", error)
      // Handle error appropriately, maybe show a notification
      this.showError("Could not update balance after login.")
    })
    
    // Broadcast initial state update immediately
    this.broadcastState()
  }
  
  /**
   * Handle logout
   */
  handleLogout() {
    console.log("Logout event")
    this.authenticatedValue = false
    this.creditsValue = 0
    this.callStatusValue = 'idle'
    
    // Broadcast updated state
    this.broadcastState()
  }
  
  /**
   * Handle call started
   */
  handleCallStarted() {
    this.callInProgressValue = true
    this.callStatusValue = 'active'
    
    // Broadcast updated state
    this.broadcastState()
  }
  
  /**
   * Handle call ended
   */
  handleCallEnded() {
    console.log("Application controller: handleCallEnded event received.")
    this.callInProgressValue = false
    this.callStatusValue = 'ended'
    
    // Broadcast updated state
    this.broadcastState()
    
    // Trigger a hide-modal event - this might be used by other modals, keep it general
    document.dispatchEvent(new CustomEvent('papercup:hide-modal'))
  }
  
  /**
   * Handle call status changed
   */
  handleCallStatusChanged(event) {
    console.log("Application controller: handleCallStatusChanged event received:", event.detail.status)
    this.callStatusValue = event.detail.status
    
    if (event.detail.status === 'active') {
      this.callInProgressValue = true
    } else if (event.detail.status === 'ended' || event.detail.status === 'idle') {
      this.callInProgressValue = false
    }
    
    // Broadcast updated state
    this.broadcastState()
  }
  
  /**
   * Handle credits updated
   */
  handleCreditsUpdated(event) {
    console.log("Credits update event received:", event.detail);
    
    // Validate credits value
    let credits = 0;
    if (event.detail && event.detail.credits !== undefined) {
      credits = parseFloat(event.detail.credits);
      if (isNaN(credits)) {
        console.error("Invalid credits value from event:", event.detail.credits);
        credits = 0;
      }
    }
    
    console.log("Setting validated credits value:", credits);
    this.creditsValue = credits;
    
    // Show low balance warning if credits are below threshold
    if (this.creditsValue < 10) {
      this.showLowBalanceWarning();
    }
    
    // Broadcast updated state
    this.broadcastState();
  }
  
  /**
   * Show low balance warning
   */
  showLowBalanceWarning() {
    document.dispatchEvent(new CustomEvent('papercup:show-notification', {
      detail: {
        type: 'warning',
        title: 'Low Balance',
        message: 'Your credit balance is running low. Please add more credits to continue making calls.'
      }
    }))
  }
  
  /**
   * Handle showing notifications
   */
  handleShowNotification(event) {
    const { type = 'info', title, message } = event.detail
    console.log("Show notification:", type, title, message)
    
    // Get notification container
    const container = this.notificationContainerTarget
    
    // Get all icon elements
    const successIcon = container.querySelector('[data-success-icon]')
    const warningIcon = container.querySelector('[data-warning-icon]')
    const errorIcon = container.querySelector('[data-error-icon]')
    const infoIcon = container.querySelector('[data-info-icon]')
    
    // Hide all icons first
    successIcon.classList.add('hidden')
    warningIcon.classList.add('hidden')
    errorIcon.classList.add('hidden')
    infoIcon.classList.add('hidden')
    
    // Show the appropriate icon based on type
    switch(type) {
      case 'success':
        successIcon.classList.remove('hidden')
        break
      case 'warning':
        warningIcon.classList.remove('hidden')
        break
      case 'error':
        errorIcon.classList.remove('hidden')
        break
      case 'info':
      default:
        infoIcon.classList.remove('hidden')
        break
    }
    
    // Set background color based on type
    const colors = {
      success: 'bg-green-50',
      warning: 'bg-yellow-50',
      error: 'bg-red-50',
      info: 'bg-blue-50'
    }
    
    const baseClasses = 'flex items-start gap-4 p-4 rounded-lg shadow-lg bg-white'
    container.querySelector('div').className = `${baseClasses} ${colors[type] || colors.info}`
    
    // Title and message
    const titleEl = container.querySelector('[data-notification-title]')
    const messageEl = container.querySelector('[data-notification-message]')
    
    // Set content
    if (title) {
      titleEl.textContent = title
      titleEl.classList.remove('hidden')
    } else {
      titleEl.classList.add('hidden')
    }
    messageEl.textContent = message
    
    // Show notification
    container.classList.remove('hidden')
    
    // Auto-dismiss after 5 seconds
    this.autoDismissTimeout = setTimeout(() => {
      this.hideNotification()
    }, 5000)
  }
  
  /**
   * Hide notification
   */
  hideNotification() {
    if (this.autoDismissTimeout) {
      clearTimeout(this.autoDismissTimeout)
    }
    this.notificationContainerTarget.classList.add('hidden')
  }
  
  /**
   * Authenticated value changed
   */
  authenticatedValueChanged(value) {
    console.log("Auth value changed:", value)
    document.body.classList.toggle('authenticated', value)
  }
  
  /**
   * Credits value changed
   */
  creditsValueChanged(value) {
    console.log("Credits value changed:", value);
    
    // Make sure value is a valid number
    let displayValue = 0;
    
    try {
      // Handle different formats of the value
      if (value === undefined || value === null || value === '') {
        console.warn('Credits value is empty or undefined, defaulting to 0');
      } else if (typeof value === 'object' && value !== null) {
        // Handle object format (possibly a Money object)
        if (value.cents !== undefined) {
          displayValue = parseFloat(value.cents) / 100;
        } else if (value.amount !== undefined) {
          displayValue = parseFloat(value.amount);
        }
      } else {
        // Try to parse as number
        displayValue = parseFloat(value);
      }
      
      // Ensure we have a valid number
      if (isNaN(displayValue)) {
        console.error("Invalid credits value resulted in NaN:", value);
        displayValue = 0;
      }
    } catch (error) {
      console.error("Error processing credits value:", error);
      displayValue = 0;
    }
    
    // Set the data attribute with the validated value
    document.body.dataset.credits = displayValue;
    
    // Format the value to 2 decimal places
    const formattedValue = displayValue.toFixed(2);
    console.log("Formatted balance value:", formattedValue);
    
    // Update all elements with data-application-balance attribute
    const balanceElements = document.querySelectorAll('[data-application-balance]');
    balanceElements.forEach(element => {
      if (element) {
        element.textContent = formattedValue;
      }
    });
  }
  
  /**
   * Call in progress value changed
   */
  callInProgressValueChanged(value) {
    document.body.classList.toggle('call-in-progress', value)
  }
  
  /**
   * Call status value changed
   */
  callStatusValueChanged(value) {
    console.log("Call status changed:", value)
    document.body.dataset.callStatus = value
  }
  
  /**
   * Handle showing a modal
   */
  handleShowModal(event) {
    const { id } = event.detail
    console.log("Show modal:", id)
    
    // Find modal by ID and show it
    const modal = document.getElementById(id)
    if (modal && modal.dataset.controller) {
      // Get the controller name
      const controllerName = modal.dataset.controller
      
      // Find a method to call directly
      if (controllerName === 'login-modal') {
        // Find the controller instance
        const controller = this.application.getControllerForElementAndIdentifier(modal, controllerName)
        if (controller && typeof controller.open === 'function') {
          controller.open()
        }
      }
    }
  }
  
  /**
   * Handle hiding a modal
   */
  handleHideModal() {
    console.log("Hide modal")
    
    // Find all modal elements
    const modals = document.querySelectorAll('[data-controller$="-modal"]')
    modals.forEach(modal => {
      const controllerName = modal.dataset.controller
      const controller = this.application.getControllerForElementAndIdentifier(modal, controllerName)
      if (controller && typeof controller.close === 'function') {
        controller.close()
      }
    })
  }
  
  /**
   * Show an error notification
   */
  showError(message) {
    document.dispatchEvent(new CustomEvent('papercup:show-notification', {
      detail: {
        type: 'error',
        message: message
      }
    }));
  }
} 