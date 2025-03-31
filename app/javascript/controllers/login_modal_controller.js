import { Controller } from "@hotwired/stimulus"
import { authApi } from "../services/mockApi"

/**
 * Login modal controller
 * Handles opening/closing the modal and authentication flow
 */
export default class extends Controller {
  static targets = ["email", "password", "error"]
  
  connect() {
    // Listen for global events to show/hide modal
    document.addEventListener('papercup:show-modal', this.handleShowModal.bind(this))
    document.addEventListener('papercup:hide-modal', this.close.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('papercup:show-modal', this.handleShowModal.bind(this))
    document.removeEventListener('papercup:hide-modal', this.close.bind(this))
  }
  
  /**
   * Handle show modal event
   */
  handleShowModal(event) {
    if (event.detail.id === 'login-modal') {
      this.open()
    }
  }
  
  /**
   * Open the login modal
   */
  open() {
    this.element.classList.remove('hidden')
    setTimeout(() => {
      this.element.querySelectorAll('input')[0].focus()
    }, 100)
  }
  
  /**
   * Close the login modal
   */
  close() {
    this.element.classList.add('hidden')
    this.clearError()
  }
  
  /**
   * Handle login form submission
   */
  async login(event) {
    event.preventDefault()
    
    const email = this.emailTarget.value
    const password = this.passwordTarget.value
    
    // Basic validation
    if (!email || !password) {
      this.showError("Please enter both email and password")
      return
    }
    
    try {
      // Call the mock API for login
      const response = await authApi.login(email, password)
      
      // Dispatch login event to update global state
      document.dispatchEvent(new CustomEvent('papercup:login', {
        detail: {
          user: response.user,
          credits: response.credits
        }
      }))
      
      // Show success message
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Successfully logged in!" }
      }))
      
      // Close the modal
      this.close()
    } catch (error) {
      this.showError(error.message || "Login failed. Please try again.")
    }
  }
  
  /**
   * Show an error message in the form
   */
  showError(message) {
    this.errorTarget.textContent = message
    this.errorTarget.classList.remove('hidden')
  }
  
  /**
   * Clear the error message
   */
  clearError() {
    this.errorTarget.textContent = ""
    this.errorTarget.classList.add('hidden')
  }
} 