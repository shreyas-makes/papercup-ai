import { Controller } from "@hotwired/stimulus"
import { debugApi, authApi, creditApi } from "../services/mockApi"

/**
 * Debug panel controller for development testing
 * This panel will be hidden in production
 */
export default class extends Controller {
  static targets = ["creditInput", "errorTypeSelect", "panel"]
  static values = {
    environment: String
  }
  
  connect() {
    // Hide in production environment
    if (this.environmentValue === "production") {
      this.panelTarget.classList.add("hidden")
      return
    }
    
    // Add keyboard shortcut (Shift+Ctrl+D) to toggle panel
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
  }
  
  handleKeyDown(event) {
    // Toggle debug panel with Shift+Ctrl+D
    if (event.shiftKey && event.ctrlKey && event.key === 'D') {
      event.preventDefault()
      this.togglePanel()
    }
  }
  
  togglePanel() {
    this.panelTarget.classList.toggle("hidden")
  }
  
  /**
   * Set a custom credit balance for testing
   */
  async setCredits(event) {
    event.preventDefault()
    
    const amount = parseFloat(this.creditInputTarget.value)
    
    if (isNaN(amount) || amount < 0) {
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Please enter a valid credit amount" }
      }))
      return
    }
    
    try {
      const result = await debugApi.setCredits(amount)
      
      // Update global state
      document.dispatchEvent(new CustomEvent('papercup:credits-updated', {
        detail: { credits: result.newBalance }
      }))
      
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: `Credit balance set to $${result.newBalance.toFixed(2)}` }
      }))
    } catch (error) {
      console.error("Error setting credits:", error)
    }
  }
  
  /**
   * Reset all call history
   */
  async resetCalls(event) {
    event.preventDefault()
    
    try {
      await debugApi.resetCalls()
      
      // Refresh call history controllers
      document.dispatchEvent(new CustomEvent('papercup:call-history-reset'))
      
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Call history has been reset" }
      }))
    } catch (error) {
      console.error("Error resetting calls:", error)
    }
  }
  
  /**
   * Trigger a specific error for testing error handling
   */
  async triggerError(event) {
    event.preventDefault()
    
    const errorType = this.errorTypeSelectTarget.value
    
    try {
      await debugApi.triggerError(errorType)
    } catch (error) {
      // This will always trigger an error - that's the point
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: error.message }
      }))
    }
  }
  
  /**
   * Toggle authentication status (login/logout)
   */
  async toggleAuth(event) {
    event.preventDefault()
    
    const isAuthenticated = localStorage.getItem('papercup_auth') === 'true'
    
    if (isAuthenticated) {
      // Log out
      await authApi.logout()
      
      document.dispatchEvent(new CustomEvent('papercup:logout'))
      
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Logged out successfully" }
      }))
    } else {
      // Log in
      try {
        const response = await authApi.login('test@example.com', 'password')
        
        document.dispatchEvent(new CustomEvent('papercup:login', {
          detail: {
            user: response.user,
            credits: response.credits
          }
        }))
        
        document.dispatchEvent(new CustomEvent('papercup:show-warning', {
          detail: { message: "Logged in successfully" }
        }))
      } catch (error) {
        document.dispatchEvent(new CustomEvent('papercup:show-warning', {
          detail: { message: error.message }
        }))
      }
    }
  }
  
  /**
   * Add test credits
   */
  async addTestCredits(event) {
    event.preventDefault()
    
    try {
      const amount = 10
      const result = await creditApi.addCredits(amount)
      
      // Update global state
      document.dispatchEvent(new CustomEvent('papercup:credits-updated', {
        detail: { credits: result.newBalance }
      }))
      
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: `Added $${amount.toFixed(2)} credits. New balance: $${result.newBalance.toFixed(2)}` }
      }))
    } catch (error) {
      console.error("Error adding credits:", error)
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: error.message }
      }))
    }
  }
} 