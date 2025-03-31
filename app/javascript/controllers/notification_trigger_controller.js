import { Controller } from "@hotwired/stimulus"

/**
 * Controller for triggering different notifications
 */
export default class extends Controller {
  showLowBalanceBanner() {
    // Look for existing banner
    let banner = document.querySelector('[data-controller="notification"][data-notification-type-value="banner"]');
    
    // If it exists, just show it
    if (banner) {
      banner.classList.remove('hidden');
      return;
    }
    
    // Otherwise create a new one
    const container = document.createElement('div');
    container.classList.add('fixed', 'top-0', 'left-0', 'w-full', 'z-50', 'bg-warning-bg', 'shadow-md');
    
    // Set notification data attributes
    container.setAttribute('data-controller', 'notification');
    container.setAttribute('data-notification-type-value', 'banner');
    container.setAttribute('data-notification-auto-hide-value', 'false');
    container.setAttribute('data-notification-target', 'notification');
    
    // Set banner content
    container.innerHTML = `
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium">Your balance is low (<span class="font-bold">$0.00</span> remaining)</span>
        </div>
        
        <div class="flex items-center space-x-3">
          <a href="#" class="bg-accent hover:bg-yellow-600 text-black font-semibold py-1 px-4 rounded-md text-sm transition-colors">
            Add Credits
          </a>
          
          <button 
            class="text-gray-600 hover:text-gray-800" 
            data-action="notification#hide">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Initialize the notification controller
    const application = this.application;
    application.getControllerForElementAndIdentifier(container, "notification").connect();
  }
  
  showNetworkError() {
    this._renderErrorNotification("Network connection issue. Please check your internet connection.", "network");
  }
  
  showInvalidNumberError() {
    this._renderErrorNotification("Invalid phone number format. Please try again.", "invalid_number");
  }
  
  showInsufficientCreditsError() {
    this._renderErrorNotification(
      "Insufficient credits to make this call.", 
      "insufficient_credits", 
      "Add Credits", 
      "/credits"
    );
  }
  
  showPermissionsError() {
    this._renderErrorNotification(
      "Microphone access denied. Please allow microphone permissions in your browser.", 
      "permissions"
    );
  }
  
  showCreditsAddedSuccess() {
    this._renderSuccessNotification("Credits added successfully!");
  }
  
  showCallCompletedSuccess(event) {
    const duration = event.detail?.duration || "0m 0s";
    this._renderSuccessNotification(`Call completed successfully! Duration: ${duration}`);
  }
  
  showSettingsUpdatedSuccess() {
    this._renderSuccessNotification("Settings updated successfully!");
  }
  
  // Private methods
  
  _renderErrorNotification(message, errorType, actionText = null, actionUrl = null) {
    // Create container for notification
    const container = document.createElement('div');
    
    // Find existing notifications to stack them properly
    const existingToasts = document.querySelectorAll('.toast-notification');
    const toastCount = existingToasts.length;
    const topOffset = 20 + (toastCount * 10); // Stagger notifications slightly
    
    container.classList.add('fixed', 'z-50', 'toast-notification');
    container.style.top = `${topOffset}px`;
    container.style.right = '20px'; // Increased margin
    container.style.maxWidth = '360px'; // Fixed width
    container.style.width = 'calc(100% - 40px)'; // Responsive width with margin
    
    // Set notification data attributes
    container.setAttribute('data-controller', 'notification');
    container.setAttribute('data-notification-type-value', 'toast');
    container.setAttribute('data-notification-auto-hide-value', 'true');
    container.setAttribute('data-notification-duration-value', '5000');
    container.setAttribute('data-notification-target', 'notification');
    
    // Render error notification HTML
    let iconPath = '';
    
    switch (errorType) {
      case 'network':
        iconPath = 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z';
        break;
      case 'invalid_number':
        iconPath = 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
        break;
      case 'insufficient_credits':
        iconPath = 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        break;
      case 'permissions':
        iconPath = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
        break;
      default:
        iconPath = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div class="flex p-4">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
            </svg>
          </div>
          
          <div class="ml-3 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900" data-notification-target="content">
              ${message}
            </p>
            ${actionText && actionUrl ? `
              <div class="mt-3 flex space-x-3">
                <a href="${actionUrl}" class="bg-white text-sm font-medium text-accent hover:text-yellow-600">
                  ${actionText}
                </a>
              </div>
            ` : ''}
          </div>
          
          <div class="flex-shrink-0 flex ml-4">
            <button
              class="inline-flex text-gray-400 hover:text-gray-500"
              data-action="notification#hide"
              data-notification-target="dismiss">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="bg-gray-100 px-4 py-1 rounded-b-lg">
          <div class="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div data-notification-target="progress" class="h-full bg-accent rounded-full w-full"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Initialize the Stimulus controller
    const application = this.application;
    application.getControllerForElementAndIdentifier(container, "notification").connect();
  }
  
  _renderSuccessNotification(message) {
    // Create container for notification
    const container = document.createElement('div');
    
    // Find existing notifications to stack them properly
    const existingToasts = document.querySelectorAll('.toast-notification');
    const toastCount = existingToasts.length;
    const topOffset = 20 + (toastCount * 10); // Stagger notifications slightly
    
    container.classList.add('fixed', 'z-50', 'toast-notification');
    container.style.top = `${topOffset}px`;
    container.style.right = '20px'; // Increased margin
    container.style.maxWidth = '360px'; // Fixed width
    container.style.width = 'calc(100% - 40px)'; // Responsive width with margin
    
    // Set notification data attributes
    container.setAttribute('data-controller', 'notification');
    container.setAttribute('data-notification-type-value', 'toast');
    container.setAttribute('data-notification-auto-hide-value', 'true');
    container.setAttribute('data-notification-duration-value', '3000');
    container.setAttribute('data-notification-target', 'notification');
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div class="flex p-4">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div class="ml-3 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900" data-notification-target="content">
              ${message}
            </p>
          </div>
          
          <div class="flex-shrink-0 flex ml-4">
            <button
              class="inline-flex text-gray-400 hover:text-gray-500"
              data-action="notification#hide"
              data-notification-target="dismiss">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="bg-gray-100 px-4 py-1 rounded-b-lg">
          <div class="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div data-notification-target="progress" class="h-full bg-success rounded-full w-full"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Initialize the Stimulus controller
    const application = this.application;
    application.getControllerForElementAndIdentifier(container, "notification").connect();
  }
} 