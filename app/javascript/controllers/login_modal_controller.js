import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

/**
 * Login modal controller
 * Handles opening/closing the modal and authentication flow
 */
export default class extends Controller {
  static targets = ["email", "password", "error"]
  
  connect() {
    console.log("Login modal controller connected")
    // Listen for the show modal event
    document.addEventListener('papercup:show-modal', this.handleShowModal.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('papercup:show-modal', this.handleShowModal.bind(this))
  }
  
  /**
   * Handle show modal event
   */
  handleShowModal(event) {
    if (event.detail.id === 'login-modal') {
      this.show()
    }
  }
  
  /**
   * Open the login modal
   */
  show() {
    this.element.classList.remove('hidden')
  }
  
  /**
   * Close the login modal
   */
  close() {
    this.element.classList.add('hidden')
  }
  
  /**
   * Handle login form submission
   */
  async login(event) {
    event.preventDefault()
    
    const email = this.emailTarget.value
    const password = this.passwordTarget.value
    
    if (!email || !password) {
      this.showError("Please enter email and password")
      return
    }
    
    try {
      this.showLoading()
      console.log("Attempting login with", email)
      const response = await api.login(email, password)
      
      if (response.token) {
        console.log("Login successful")
        this.close()
        // Dispatch an event to notify other controllers that user has logged in
        document.dispatchEvent(new CustomEvent('papercup:login', {
          detail: { success: true }
        }))
      } else {
        this.showError("Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showError(error.message || "Login failed. Please try again.")
    } finally {
      this.hideLoading()
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
  hideError() {
    this.errorTarget.textContent = ''
    this.errorTarget.classList.add('hidden')
  }
  
  showLoading() {
    const button = this.element.querySelector('button[type="submit"]')
    if (button) {
      button.disabled = true
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing in...
      `
    }
  }
  
  hideLoading() {
    const button = this.element.querySelector('button[type="submit"]')
    if (button) {
      button.disabled = false
      button.innerHTML = 'Sign In'
    }
  }
} 