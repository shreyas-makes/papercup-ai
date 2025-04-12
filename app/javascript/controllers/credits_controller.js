import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

export default class extends Controller {
  static targets = ["checkoutContainer", "selectedPackageDetails", "package", "balance", "history"]
  
  connect() {
    console.log("Credits controller connected")
    console.log("API service:", api)
    this.selectedPackageId = null
    
    // Initialize Stripe
    this.stripe = Stripe(document.querySelector('meta[name="stripe-key"]')?.content || '')
    console.log("Stripe key:", document.querySelector('meta[name="stripe-key"]')?.content)
    
    // Load initial data
    this.loadBalance()
    this.loadHistory()

    // Listen for login events
    document.addEventListener('papercup:login', this.handleLogin.bind(this))
  }

  disconnect() {
    document.removeEventListener('papercup:login', this.handleLogin.bind(this))
  }

  handleLogin(event) {
    console.log("Login event received:", event.detail)
    // If we have a pending package selection, retry it
    if (this.selectedPackageId) {
      console.log("Retrying package selection after login")
      this.selectPackage({ 
        preventDefault: () => {},
        currentTarget: this.element.querySelector(`[data-package-id="${this.selectedPackageId}"]`)
      })
    }
  }

  async selectPackage(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const packageId = button.dataset.packageId;
    
    // Store the package ID in case we need to retry after login
    this.selectedPackageId = packageId;
    
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error("No auth token found, user not logged in");
      this.showError("Please log in to purchase credits");
      // Show login modal
      document.dispatchEvent(new CustomEvent('papercup:show-modal', {
        detail: { id: 'login-modal' }
      }));
      return;
    }
    
    try {
      // Change button text instead of adding spinner
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Processing...";
      
      // Get checkout session from API
      const data = await api.purchaseCredits(packageId);
      
      if (data && data.id) {
        // Replace with a nicer redirect message
        button.textContent = "Redirecting to checkout...";
        
        // Small delay to show the "Redirecting" message
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use the Stripe instance to redirect
        await this.stripe.redirectToCheckout({
          sessionId: data.id
        });
      } else {
        console.error("No session ID in response:", data);
        this.showError("Failed to initiate payment. Please try again later.");
        button.textContent = originalText;
        button.disabled = false;
      }
    } catch (error) {
      console.error("Error in selectPackage:", error);
      this.showError(error.message || "Failed to select package. Please try again later.");
      button.textContent = "Select Package";
      button.disabled = false;
    }
  }

  async loadBalance() {
    try {
      this.showLoading(this.balanceTarget)
      const data = await api.getBalance()
      this.updateBalanceDisplay(data.balance)
    } catch (error) {
      console.error("Error loading balance:", error)
      this.showError("Failed to load balance. Please try again later.")
    } finally {
      this.hideLoading(this.balanceTarget)
    }
  }

  async loadHistory() {
    try {
      this.showLoading(this.historyTarget)
      const data = await api.getHistory()
      this.updateHistoryDisplay(data.transactions || [])
    } catch (error) {
      console.error("Error loading history:", error)
      this.showError("Failed to load history. Please try again later.")
    } finally {
      this.hideLoading(this.historyTarget)
    }
  }

  updateBalanceDisplay(balance) {
    if (this.balanceTarget) {
      // Format balance as currency
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      });
      this.balanceTarget.textContent = formatter.format(balance);
    }
  }

  updateHistoryDisplay(history) {
    if (this.historyTarget) {
      if (history.length === 0) {
        this.historyTarget.innerHTML = '<p class="text-gray-600 text-center">Your transaction history will appear here.</p>'
        return
      }
      
      const historyHtml = history.map(item => `
        <div class="border-b border-gray-200 py-4">
          <div class="flex justify-between">
            <div>
              <p class="font-medium">${item.description}</p>
              <p class="text-sm text-gray-500">${item.date}</p>
            </div>
            <p class="font-medium ${item.amount_cents > 0 ? 'text-green-600' : 'text-red-600'}">
              ${item.amount_cents > 0 ? '+' : ''}$${Math.abs(item.amount_cents / 100).toFixed(2)}
            </p>
          </div>
        </div>
      `).join('')
      
      this.historyTarget.innerHTML = historyHtml
    }
  }

  showLoading(element) {
    element.classList.add('opacity-50')
    element.disabled = true
    
    // Add loading spinner if not already present
    if (!element.querySelector('.loading-spinner')) {
      const spinner = document.createElement('div')
      spinner.className = 'loading-spinner'
      spinner.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `
      element.appendChild(spinner)
    }
  }

  hideLoading(element) {
    element.classList.remove('opacity-50')
    element.disabled = false
    
    // Remove loading spinner
    const spinner = element.querySelector('.loading-spinner')
    if (spinner) {
      spinner.remove()
    }
  }

  showError(message) {
    // Dispatch error event for toast notification
    document.dispatchEvent(new CustomEvent('papercup:show-toast', {
      detail: { 
        type: 'error',
        message: message
      }
    }));
  }

  async initializeStripe() {
    const stripeKey = document.querySelector('meta[name="stripe-key"]')?.content;
    if (!stripeKey) {
      throw new Error("Stripe public key not found");
    }
    return Stripe(stripeKey);
  }
} 