import { Controller } from "@hotwired/stimulus"
import api from "../services/api"
import { mockCalls } from "../data/mock_calls"

console.log("LOADING call_history_controller.js");

export default class extends Controller {
  static targets = ["list", "emptyState", "template"]
  static values = {
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    loading: { type: Boolean, default: false }
  }

  connect() {
    console.log("Call history controller connected");
    console.log("Element: ", this.element);
    console.log("Targets found:", {
      list: this.hasListTarget,
      emptyState: this.hasEmptyStateTarget,
      template: this.hasTemplateTarget
    });
    
    // Initial load of call history
    this.loadCallHistory()
    
    // Listen for call status changes to update history
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }
  
  disconnect() {
    // Clean up event listener
    document.removeEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }
  
  /**
   * Handle call status changes to refresh call history when calls end
   */
  handleCallStatusChanged(event) {
    console.log("Call status changed event received:", event.detail)
    
    const { status } = event.detail
    
    // When a call ends, refresh the call history
    if (status === 'ended') {
      console.log("Call ended, scheduling call history refresh")
      // Wait a moment for backend to update
      setTimeout(() => {
        this.loadCallHistory()
      }, 500)
    }
  }

  /**
   * Load call history from the API
   */
  async loadCallHistory() {
    if (this.loadingValue) return
    
    console.log("Loading call history...")
    this.loadingValue = true
    
    try {
      // Simply use the mock data directly
      console.log("Using mockCalls directly", mockCalls);
      this.renderCallHistory(mockCalls);
    } catch (error) {
      console.error("Error loading call history:", error)
      document.dispatchEvent(new CustomEvent('papercup:show-warning', {
        detail: { message: "Failed to load call history" }
      }))
    } finally {
      this.loadingValue = false
    }
  }

  /**
   * Render the call history to the UI
   */
  renderCallHistory(calls) {
    console.log("Rendering call history with data:", calls)
    
    if (!this.hasListTarget) {
      console.error("List target not found!");
      return;
    }
    
    // Clear the list
    this.listTarget.innerHTML = ""

    // Handle array or object responses
    const callsArray = Array.isArray(calls) ? calls : (calls.calls || []);
    console.log("Processed calls array:", callsArray)

    if (!callsArray || callsArray.length === 0) {
      console.log("No calls to display, showing empty state")
      this.listTarget.classList.add("hidden")
      this.emptyStateTarget.classList.remove("hidden")
      return
    }

    console.log("Displaying", callsArray.length, "calls in history")
    this.listTarget.classList.remove("hidden")
    this.emptyStateTarget.classList.add("hidden")

    // Render each call history entry
    callsArray.forEach(call => {
      console.log("Processing call:", call)
      const entryElement = this.templateTarget.content.cloneNode(true)
      
      const callDetails = entryElement.querySelector(".call-details")
      const phoneNumber = entryElement.querySelector(".phone-number")
      const timestamp = entryElement.querySelector(".timestamp")
      const duration = entryElement.querySelector(".duration")
      const flag = entryElement.querySelector(".country-flag")
      const entryContainer = entryElement.querySelector(".call-entry")
      
      // Format the phone number
      phoneNumber.textContent = call.phone_number || call.phoneNumber
      
      // Get relative time
      const callTime = new Date(call.start_time || call.startTime || call.created_at || call.timestamp)
      timestamp.textContent = this.getRelativeTime(callTime)
      
      // Set the country flag (would come from a more complete implementation)
      flag.textContent = this.getFlagEmoji(call.country_code || call.countryCode) || '🌐'
      
      // Format the duration
      if (call.end_time || call.endTime) {
        const durationSeconds = this.calculateDuration(call) || 0
        const minutes = Math.floor(durationSeconds / 60)
        const seconds = durationSeconds % 60
        duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
      } else {
        duration.textContent = "In progress"
        duration.classList.add("text-blue-500")
      }
      
      // Set data attributes for redialing
      callDetails.dataset.phoneNumber = call.phone_number || call.phoneNumber
      callDetails.dataset.countryCode = call.country_code || call.countryCode
      
      this.listTarget.appendChild(entryElement)
    })
  }

  /**
   * Calculate call duration in seconds
   */
  calculateDuration(call) {
    if (call.duration || call.durationSeconds) {
      return call.duration || call.durationSeconds;
    }
    
    if ((call.start_time || call.startTime) && (call.end_time || call.endTime)) {
      const startTime = new Date(call.start_time || call.startTime);
      const endTime = new Date(call.end_time || call.endTime);
      return Math.floor((endTime - startTime) / 1000);
    }
    
    return 0;
  }

  /**
   * Get relative time string (e.g. "5 minutes ago")
   */
  getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return "Just now";
    }
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    }
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    
    // Format dates older than a week with regular date
    return date.toLocaleDateString();
  }

  /**
   * Get flag emoji from country code
   */
  getFlagEmoji(countryCode) {
    if (!countryCode) return '🌐';
    
    // Convert country code to uppercase
    const cc = countryCode.toUpperCase();
    
    // Convert each letter to regional indicator symbol
    return Array.from(cc).map(char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    ).join('');
  }

  /**
   * Get the next page of call history
   */
  loadMoreCalls() {
    if (this.pageValue < this.totalPagesValue) {
      this.pageValue++
      this.loadCallHistory()
    }
  }

  /**
   * Refresh the call history
   */
  refresh() {
    console.log("Manually refreshing call history")
    this.pageValue = 1
    this.loadCallHistory()
  }

  /**
   * Redial a number from the call history
   */
  redial(event) {
    const callDetails = event.currentTarget
    const phoneNumber = callDetails.dataset.phoneNumber
    const countryCode = callDetails.dataset.countryCode

    console.log(`Redialing ${phoneNumber} (${countryCode})`)
    
    // Dispatch custom event to be handled by the dialer controller
    const redialEvent = new CustomEvent("call-history:redial", {
      bubbles: true,
      detail: {
        phoneNumber,
        countryCode
      }
    })
    
    this.element.dispatchEvent(redialEvent)
  }
} 