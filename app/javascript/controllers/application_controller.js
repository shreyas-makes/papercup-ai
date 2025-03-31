import { Controller } from "@hotwired/stimulus"
import { authApi, creditApi } from "../services/mockApi"

/**
 * Global application controller
 * Manages authentication, credit balance, and UI state
 */
export default class extends Controller {
  static values = {
    authenticated: { type: Boolean, default: false },
    credits: { type: Number, default: 0 },
    callInProgress: { type: Boolean, default: false }
  }
  
  static targets = ["notificationContainer"]
  
  connect() {
    // Listen for global events
    document.addEventListener('papercup:login', this.handleLogin.bind(this))
    document.addEventListener('papercup:logout', this.handleLogout.bind(this))
    document.addEventListener('papercup:call-started', this.handleCallStarted.bind(this))
    document.addEventListener('papercup:call-ended', this.handleCallEnded.bind(this))
    document.addEventListener('papercup:credits-updated', this.handleCreditsUpdated.bind(this))
    document.addEventListener('papercup:show-notification', this.handleShowNotification.bind(this))
    
    // Check initial auth state
    this.checkAuthState()
    
    console.log("Application controller connected")
  }
  
  disconnect() {
    document.removeEventListener('papercup:login', this.handleLogin.bind(this))
    document.removeEventListener('papercup:logout', this.handleLogout.bind(this))
    document.removeEventListener('papercup:call-started', this.handleCallStarted.bind(this))
    document.removeEventListener('papercup:call-ended', this.handleCallEnded.bind(this))
    document.removeEventListener('papercup:credits-updated', this.handleCreditsUpdated.bind(this))
    document.removeEventListener('papercup:show-notification', this.handleShowNotification.bind(this))
  }
  
  /**
   * Check initial authentication state
   */
  async checkAuthState() {
    try {
      const { authenticated, credits } = await authApi.checkAuth()
      console.log("Auth state:", authenticated, credits)
      this.authenticatedValue = authenticated
      this.creditsValue = credits
    } catch (error) {
      console.error('Failed to check auth state:', error)
    }
  }
  
  /**
   * Handle successful login
   */
  handleLogin(event) {
    console.log("Login event:", event.detail)
    this.authenticatedValue = true
    this.creditsValue = event.detail.credits
  }
  
  /**
   * Handle logout
   */
  handleLogout() {
    console.log("Logout event")
    this.authenticatedValue = false
    this.creditsValue = 0
  }
  
  /**
   * Handle call started
   */
  handleCallStarted() {
    this.callInProgressValue = true
  }
  
  /**
   * Handle call ended
   */
  handleCallEnded() {
    this.callInProgressValue = false
  }
  
  /**
   * Handle credits updated
   */
  handleCreditsUpdated(event) {
    this.creditsValue = event.detail.credits
    
    // Show low balance warning if credits are below threshold
    if (this.creditsValue < 100) {
      this.showLowBalanceWarning()
    }
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
    console.log("Credits value changed:", value)
    document.body.dataset.credits = value
  }
  
  /**
   * Call in progress value changed
   */
  callInProgressValueChanged(value) {
    document.body.classList.toggle('call-in-progress', value)
  }
} 