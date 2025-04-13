import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "status"]

  connect() {
    this.stripe = Stripe(document.querySelector('meta[name="stripe-key"]').content)
    // Add card element container
    const cardElement = document.createElement('div')
    cardElement.id = 'card-element'
    cardElement.classList.add('mt-4', 'p-4', 'border', 'rounded')
    this.element.insertBefore(cardElement, this.statusTarget)
  }

  async testPayment(event) {
    const button = event.currentTarget
    const packageId = button.dataset.packageId

    try {
      this.statusTarget.textContent = "Initiating test payment..."

      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      if (!csrfToken) {
        throw new Error('CSRF token not found. Please refresh the page.')
      }

      // Create a checkout session using the package identifier directly
      const response = await fetch('/credits/create_checkout_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          credit_package_id: packageId // Use the identifier directly
        }),
        credentials: 'same-origin'
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.')
        }
        
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create checkout session')
        } catch (jsonError) {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data = await response.json()

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const result = await this.stripe.redirectToCheckout({
          sessionId: data.sessionId
        })

        if (result.error) {
          this.statusTarget.textContent = "❌ Payment failed: " + result.error.message
        }
      } else {
        this.statusTarget.textContent = "❌ Failed to create checkout session"
      }
    } catch (error) {
      this.statusTarget.textContent = "❌ Payment test failed: " + error.message
      console.error('Payment test error:', error)
    }
  }
} 