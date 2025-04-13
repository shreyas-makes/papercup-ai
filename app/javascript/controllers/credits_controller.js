import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

export default class extends Controller {
  static targets = ["checkoutContainer", "selectedPackageDetails", "package", "balance", "history"]
  
  connect() {
    console.log('Credits controller connected');
    
    // Check for targets and log their existence
    const balanceElements = document.querySelectorAll('[data-credits-target="balance"]');
    const historyElements = document.querySelectorAll('[data-credits-target="history"]');
    const errorElements = document.querySelectorAll('[data-credits-target="error"]');
    const loadingElements = document.querySelectorAll('[data-credits-target="loading"]');
    
    console.log('Found balance elements:', balanceElements.length);
    console.log('Found history elements:', historyElements.length);
    console.log('Found error elements:', errorElements.length);
    console.log('Found loading elements:', loadingElements.length);
    
    // Initialize Stripe (if needed)
    if (window.Stripe) {
      try {
        const stripePublicKey = document.querySelector('meta[name="stripe-public-key"]')?.content;
        if (stripePublicKey) {
          this.stripe = window.Stripe(stripePublicKey);
          console.log('Stripe initialized with public key');
        } else {
          console.warn('Stripe public key not found in meta tags');
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
      }
    } else {
      console.warn('Stripe.js not loaded');
    }
    
    // Load initial data
    this.loadBalance();
    this.loadHistory();

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
      this.showLoading();
      const data = await api.getBalance();
      console.log('Balance data:', data);
      
      if (data && data.balance !== undefined) {
        this.updateBalanceDisplay(data.balance);
      } else {
        console.error('Invalid balance data received:', data);
        this.updateBalanceDisplay(0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      this.showError('Unable to load balance');
      this.updateBalanceDisplay(0);
    } finally {
      this.hideLoading();
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
    try {
      // Ensure balance is a number
      let balanceValue = 0;
      
      // Handle null/undefined/empty values gracefully
      if (balance === null || balance === undefined || balance === '') {
        console.warn('Received null/undefined/empty balance, defaulting to 0');
      } else if (typeof balance === 'object') {
        // Handle Money object format with proper null checking
        if (balance.cents !== undefined && balance.cents !== null) {
          balanceValue = parseInt(balance.cents, 10) || 0;
        } else if (balance.amount !== undefined && balance.amount !== null) {
          balanceValue = Math.round(parseFloat(balance.amount) * 100) || 0;
        }
      } else if (typeof balance === 'number') {
        // Handle raw number format (dollars)
        balanceValue = isNaN(balance) ? 0 : Math.round(balance * 100);
      } else if (typeof balance === 'string') {
        // Handle string format
        const cleanString = balance.replace(/[^0-9.-]+/g, '');
        balanceValue = cleanString ? Math.round(parseFloat(cleanString) * 100) : 0;
      }
      
      // Ensure we don't have NaN after conversion
      if (isNaN(balanceValue)) {
        console.error('Invalid balance value resulted in NaN:', balance);
        balanceValue = 0;
      }
      
      // Format as currency (2 decimal places)
      const formattedBalance = (balanceValue / 100).toFixed(2);
      
      // Update all balance elements
      document.querySelectorAll('[data-credits-target="balance"], [data-active-call-target="credits"]').forEach(el => {
        if (el) el.textContent = `$${formattedBalance}`;
      });
      
      // Dispatch an event to update the application balance
      document.dispatchEvent(new CustomEvent('papercup:credits-updated', {
        detail: { credits: balanceValue / 100 }
      }));
      
      console.log('Balance updated:', formattedBalance);
    } catch (error) {
      console.error('Error updating balance display:', error);
      // Fallback to zero if there's an error
      document.querySelectorAll('[data-credits-target="balance"], [data-active-call-target="credits"]').forEach(el => {
        if (el) el.textContent = '$0.00';
      });
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
    try {
      const loadingElements = element ? [element] : 
        document.querySelectorAll('[data-credits-target="loading"]');
      
      loadingElements.forEach(el => {
        if (el) el.classList.remove('hidden');
      });
    } catch (error) {
      console.error('Error showing loading state:', error);
    }
  }

  hideLoading(element) {
    try {
      const loadingElements = element ? [element] : 
        document.querySelectorAll('[data-credits-target="loading"]');
      
      loadingElements.forEach(el => {
        if (el) el.classList.add('hidden');
      });
    } catch (error) {
      console.error('Error hiding loading state:', error);
    }
  }

  showError(message) {
    try {
      const errorElements = document.querySelectorAll('[data-credits-target="error"]');
      
      errorElements.forEach(el => {
        if (el) {
          el.textContent = message;
          el.classList.remove('hidden');
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            el.classList.add('hidden');
          }, 5000);
        }
      });
      
      // If no error elements found, log to console
      if (!errorElements.length) {
        console.error('Error message (no error element found):', message);
      }
    } catch (error) {
      console.error('Error displaying error message:', error);
    }
  }

  async initializeStripe() {
    const stripeKey = document.querySelector('meta[name="stripe-key"]')?.content;
    if (!stripeKey) {
      throw new Error("Stripe public key not found");
    }
    return Stripe(stripeKey);
  }
} 