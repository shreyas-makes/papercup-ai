import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["checkoutContainer", "selectedPackageDetails"]
  
  connect() {
    this.selectedPackageId = null
    
    // Initialize Stripe
    this.stripe = Stripe(document.querySelector('meta[name="stripe-key"]')?.content || '')
  }

  async selectPackage(event) {
    event.preventDefault()
    const button = event.currentTarget
    const packageId = button.dataset.packageId
    
    // Disable the button and show loading state
    button.disabled = true
    const originalText = button.textContent
    button.textContent = 'Processing...'
    
    try {
      // Create a checkout session
      const response = await fetch('/credits/create_checkout_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          credit_package_id: packageId
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok')
      }
      
      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: data.sessionId
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (error) {
      console.error('Error:', error)
      // Show error to user
      this.showError(error.message)
    } finally {
      // Re-enable the button and restore text
      button.disabled = false
      button.textContent = originalText
    }
  }

  showError(message) {
    // Remove any existing error messages
    const existingError = this.element.querySelector('.error-message')
    if (existingError) {
      existingError.remove()
    }

    // Create and show new error message
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4'
    errorDiv.innerHTML = `
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline ml-2">${message}</span>
      <button class="absolute top-0 right-0 px-4 py-3" onclick="this.parentElement.remove()">
        <svg class="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `
    this.element.insertBefore(errorDiv, this.element.firstChild)

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove()
      }
    }, 5000)
  }
} 