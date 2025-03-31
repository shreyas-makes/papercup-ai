import { Controller } from "@hotwired/stimulus"

/**
 * Application controller for global state management
 * Handles authentication, credit balance, call status, and UI state
 */
export default class extends Controller {
  static values = {
    authenticated: { type: Boolean, default: false },
    creditBalance: { type: Number, default: 0 },
    callStatus: { type: String, default: "idle" }, // idle, connecting, active, ended
    showWarning: { type: Boolean, default: false },
    showModal: { type: Boolean, default: false },
    currentModalId: { type: String, default: "" }
  }
  
  static targets = ["balanceDisplay", "statusIndicator", "warningContainer", "modalContainer"]

  connect() {
    // Initialize state from localStorage if available
    this.loadStateFromStorage()
    
    // Broadcast initial state to other controllers
    this.broadcastState()
    
    // Listen for state changes from other controllers
    this.setupEventListeners()
  }
  
  loadStateFromStorage() {
    const storedAuth = localStorage.getItem('papercup_auth')
    const storedCredits = localStorage.getItem('papercup_credits')
    const storedCallStatus = localStorage.getItem('papercup_call_status')
    
    if (storedAuth) {
      this.authenticatedValue = JSON.parse(storedAuth)
    }
    
    if (storedCredits) {
      this.creditBalanceValue = parseInt(storedCredits, 10)
    }
    
    if (storedCallStatus) {
      this.callStatusValue = storedCallStatus
    }
    
    // Update UI based on loaded state
    this.updateUI()
  }
  
  setupEventListeners() {
    document.addEventListener('papercup:login', this.handleLogin.bind(this))
    document.addEventListener('papercup:logout', this.handleLogout.bind(this))
    document.addEventListener('papercup:credits-updated', this.handleCreditsUpdated.bind(this))
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
    document.addEventListener('papercup:show-warning', this.handleShowWarning.bind(this))
    document.addEventListener('papercup:show-modal', this.handleShowModal.bind(this))
    document.addEventListener('papercup:hide-modal', this.handleHideModal.bind(this))
  }
  
  broadcastState() {
    document.dispatchEvent(new CustomEvent('papercup:state-update', {
      detail: {
        authenticated: this.authenticatedValue,
        creditBalance: this.creditBalanceValue,
        callStatus: this.callStatusValue,
      }
    }))
  }
  
  updateUI() {
    if (this.hasBalanceDisplayTarget) {
      this.balanceDisplayTarget.textContent = this.creditBalanceValue.toFixed(2)
    }
    
    if (this.hasStatusIndicatorTarget) {
      this.statusIndicatorTarget.setAttribute('data-status', this.callStatusValue)
    }
    
    // Check for low balance warning
    if (this.creditBalanceValue < 5 && this.authenticatedValue) {
      this.showLowBalanceWarning()
    }
  }
  
  handleLogin(event) {
    const { user, credits } = event.detail
    this.authenticatedValue = true
    this.creditBalanceValue = credits || 0
    
    localStorage.setItem('papercup_auth', JSON.stringify(true))
    localStorage.setItem('papercup_user', JSON.stringify(user))
    localStorage.setItem('papercup_credits', this.creditBalanceValue.toString())
    
    this.updateUI()
    this.broadcastState()
  }
  
  handleLogout() {
    this.authenticatedValue = false
    this.creditBalanceValue = 0
    
    localStorage.removeItem('papercup_auth')
    localStorage.removeItem('papercup_user')
    localStorage.removeItem('papercup_credits')
    
    this.updateUI()
    this.broadcastState()
  }
  
  handleCreditsUpdated(event) {
    this.creditBalanceValue = event.detail.credits
    localStorage.setItem('papercup_credits', this.creditBalanceValue.toString())
    
    this.updateUI()
    this.broadcastState()
  }
  
  handleCallStatusChanged(event) {
    this.callStatusValue = event.detail.status
    localStorage.setItem('papercup_call_status', this.callStatusValue)
    
    this.updateUI()
    this.broadcastState()
  }
  
  handleShowWarning(event) {
    if (this.hasWarningContainerTarget) {
      // Implement warning display logic
      this.warningContainerTarget.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Warning!</strong>
          <span class="block sm:inline">${event.detail.message}</span>
          <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <button data-action="click->application#dismissWarning">
              <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </span>
        </div>
      `
      this.showWarningValue = true
    }
  }
  
  dismissWarning() {
    if (this.hasWarningContainerTarget) {
      this.warningContainerTarget.innerHTML = ''
      this.showWarningValue = false
    }
  }
  
  handleShowModal(event) {
    if (this.hasModalContainerTarget) {
      this.showModalValue = true
      this.currentModalIdValue = event.detail.id
      // Implement modal display logic
    }
  }
  
  handleHideModal() {
    if (this.hasModalContainerTarget) {
      this.showModalValue = false
      this.currentModalIdValue = ""
      // Implement modal hide logic
    }
  }
  
  showLowBalanceWarning() {
    document.dispatchEvent(new CustomEvent('papercup:show-warning', {
      detail: {
        message: "Your credit balance is low. Please add more credits to continue making calls."
      }
    }))
  }
} 