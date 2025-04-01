import { Controller } from "@hotwired/stimulus"

/**
 * Package Selection controller
 * Handles selection of credit packages and updates the Stripe checkout
 */
export default class extends Controller {
  static targets = ["package"]
  
  connect() {
    // Select the default package (Standard)
    this.selectDefaultPackage()
  }
  
  /**
   * Select the default package (Standard) on connect
   */
  selectDefaultPackage() {
    const defaultPackage = this.packageTargets.find(pkg => 
      pkg.dataset.packageId === 'standard'
    )
    
    if (defaultPackage) {
      this.selectPackage({ currentTarget: defaultPackage })
    }
  }
  
  /**
   * Handle package selection
   */
  selectPackage(event) {
    // Reset all packages
    this.packageTargets.forEach(pkg => {
      pkg.classList.remove('border-primary-500')
      pkg.classList.add('border-transparent')
      pkg.classList.remove('shadow-md')
      pkg.classList.add('shadow-sm')
    })
    
    // Highlight selected package
    const selectedPackage = event.currentTarget
    selectedPackage.classList.remove('border-transparent')
    selectedPackage.classList.add('border-primary-500')
    selectedPackage.classList.remove('shadow-sm')
    selectedPackage.classList.add('shadow-md')
    
    // Get package details
    const packageId = selectedPackage.dataset.packageId
    const packagePrice = selectedPackage.dataset.packagePrice
    const packageCredits = selectedPackage.dataset.packageCredits
    
    // Update global selectedPackage variable
    window.selectedPackage = packageId
    
    // Update the Stripe checkout
    this.updateCheckout(packageId)
    
    // Dispatch event for any listeners
    this.element.dispatchEvent(new CustomEvent('package-selected', {
      bubbles: true,
      detail: {
        packageId,
        packagePrice,
        packageCredits
      }
    }))
  }
  
  /**
   * Update the Stripe checkout with the selected package
   */
  async updateCheckout(packageId) {
    try {
      // Clear the checkout container
      const checkoutElement = document.getElementById('checkout')
      
      // Add loading animation
      checkoutElement.innerHTML = `
        <div class="animate-pulse flex flex-col space-y-4 py-4">
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          <div class="h-12 bg-gray-200 rounded w-full"></div>
          <div class="h-12 bg-gray-200 rounded w-full"></div>
          <div class="h-12 bg-gray-200 rounded w-full"></div>
          <div class="h-12 bg-gray-200 rounded w-full"></div>
        </div>
      `
      
      // Get a new checkout session for the selected package
      const response = await fetch("/billing_portal.json", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          package_id: packageId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update checkout')
      }
      
      const { clientSecret } = await response.json()
      
      // Create and mount new checkout
      const stripe = Stripe(document.querySelector('meta[name="stripe-key"]')?.content || '')
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
      })
      
      // Mount Checkout
      checkout.mount('#checkout')
      
    } catch (error) {
      console.error('Error updating checkout:', error)
      
      // Show error message
      const checkoutElement = document.getElementById('checkout')
      checkoutElement.innerHTML = `
        <div class="p-4 bg-red-50 text-red-700 rounded-lg">
          <p class="font-medium">There was a problem loading the checkout form.</p>
          <p class="mt-1">Please try again or contact support if the problem persists.</p>
          <button class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded" 
                  onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      `
    }
  }
} 