// Stripe Service for Papercup
// Handles payment processing with Stripe

import api from './api';

class StripeService {
  constructor() {
    this.stripe = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the Stripe service
   * @param {string} publishableKey - The Stripe publishable key
   */
  initialize(publishableKey) {
    if (this.initialized) {
      return;
    }
    
    if (!publishableKey) {
      console.error('Stripe publishable key is required');
      return;
    }
    
    // Load Stripe.js
    this.loadStripeScript().then(() => {
      this.stripe = Stripe(publishableKey);
      this.initialized = true;
      console.log('Stripe initialized');
    }).catch(error => {
      console.error('Failed to load Stripe:', error);
    });
  }
  
  /**
   * Load the Stripe.js script
   * @returns {Promise} - A promise that resolves when the script is loaded
   */
  loadStripeScript() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Create a payment intent
   * @param {number} amount - The amount in cents
   * @param {string} currency - The currency code (e.g., 'usd')
   * @returns {Promise} - A promise that resolves with the payment intent
   */
  async createPaymentIntent(amount, currency = 'usd') {
    if (!this.initialized) {
      throw new Error('Stripe is not initialized');
    }
    
    try {
      const response = await fetch('/api/payments/create_intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({ amount, currency }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  /**
   * Process a payment
   * @param {Object} paymentMethod - The payment method from Stripe Elements
   * @param {number} amount - The amount in cents
   * @param {string} currency - The currency code (e.g., 'usd')
   * @returns {Promise} - A promise that resolves with the payment result
   */
  async processPayment(paymentMethod, amount, currency = 'usd') {
    if (!this.initialized) {
      throw new Error('Stripe is not initialized');
    }
    
    try {
      // Create a payment intent
      const { client_secret } = await this.createPaymentIntent(amount, currency);
      
      // Confirm the payment
      const result = await this.stripe.confirmCardPayment(client_secret, {
        payment_method: paymentMethod.id,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
  
  /**
   * Handle a successful payment
   * @param {Object} paymentIntent - The payment intent from Stripe
   */
  async handleSuccessfulPayment(paymentIntent) {
    try {
      // Update the credit balance
      await api.getBalance();
      
      // Show success message
      this.showSuccessMessage('Payment successful! Your credits have been added to your account.');
    } catch (error) {
      console.error('Error handling successful payment:', error);
      this.showErrorMessage('Payment successful, but there was an error updating your balance.');
    }
  }
  
  /**
   * Show a success message
   * @param {string} message - The message to show
   */
  showSuccessMessage(message) {
    // Create success element if it doesn't exist
    let successElement = document.querySelector('.success-message');
    if (!successElement) {
      successElement = document.createElement('div');
      successElement.className = 'success-message fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
      document.body.appendChild(successElement);
    }
    
    // Set success message
    successElement.textContent = message;
    
    // Show success
    successElement.classList.remove('hidden');
    
    // Hide success after 5 seconds
    setTimeout(() => {
      successElement.classList.add('hidden');
    }, 5000);
  }
  
  /**
   * Show an error message
   * @param {string} message - The message to show
   */
  showErrorMessage(message) {
    // Create error element if it doesn't exist
    let errorElement = document.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
      document.body.appendChild(errorElement);
    }
    
    // Set error message
    errorElement.textContent = message;
    
    // Show error
    errorElement.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorElement.classList.add('hidden');
    }, 5000);
  }
}

export default new StripeService(); 