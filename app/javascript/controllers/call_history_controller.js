import { Controller } from "@hotwired/stimulus"
import { historyApi } from "../services/mockApi"

export default class extends Controller {
  static targets = ["list", "emptyState", "template"]
  static values = {
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    loading: { type: Boolean, default: false }
  }

  connect() {
    // Initial load of call history
    this.loadCallHistory()
    
    // Listen for call status changes to update history
    document.addEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }
  
  disconnect() {
    document.removeEventListener('papercup:call-status-changed', this.handleCallStatusChanged.bind(this))
  }
  
  /**
   * Handle call status changes to refresh call history when calls end
   */
  handleCallStatusChanged(event) {
    const { status } = event.detail
    
    // When a call ends, refresh the call history
    if (status === 'ended') {
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
    
    this.loadingValue = true
    
    try {
      const response = await historyApi.getCalls(this.pageValue)
      
      // Update pagination values
      this.totalPagesValue = response.totalPages
      
      // Render the calls
      this.renderCallHistory(response.calls)
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
    // Clear the list
    this.listTarget.innerHTML = ""

    if (!calls || calls.length === 0) {
      this.listTarget.classList.add("hidden")
      this.emptyStateTarget.classList.remove("hidden")
      return
    }

    this.listTarget.classList.remove("hidden")
    this.emptyStateTarget.classList.add("hidden")

    // Render each call history entry
    calls.forEach(call => {
      const entryElement = this.templateTarget.content.cloneNode(true)
      
      const callDetails = entryElement.querySelector(".call-details")
      const phoneNumber = entryElement.querySelector(".phone-number")
      const timestamp = entryElement.querySelector(".timestamp")
      const duration = entryElement.querySelector(".duration")
      const flag = entryElement.querySelector(".country-flag")
      const entryContainer = entryElement.querySelector(".call-entry")
      
      // Format the phone number
      phoneNumber.textContent = call.phoneNumber
      
      // Get relative time
      const callTime = new Date(call.startTime)
      timestamp.textContent = this.getRelativeTime(callTime)
      
      // Set the country flag (would come from a more complete implementation)
      flag.textContent = this.getFlagEmoji(call.countryCode) || '🌐'
      
      // Format the duration
      if (call.endTime) {
        const durationSeconds = call.durationSeconds || 0
        const minutes = Math.floor(durationSeconds / 60)
        const seconds = durationSeconds % 60
        duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
      } else {
        duration.textContent = "In progress"
        duration.classList.add("text-blue-500")
      }
      
      // Set data attributes for redialing
      callDetails.dataset.phoneNumber = call.phoneNumber
      callDetails.dataset.countryCode = call.countryCode
      
      this.listTarget.appendChild(entryElement)
    })
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

  // Helper to format timestamps
  getRelativeTime(date) {
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays === 1) {
      return `Yesterday`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
  
  /**
   * Helper to get flag emoji from country code
   */
  getFlagEmoji(countryCode) {
    if (!countryCode) return null
    
    // Simple mapping for common countries
    const flagMap = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'FR': '🇫🇷',
      'DE': '🇩🇪',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'IN': '🇮🇳',
      'BR': '🇧🇷',
      'RU': '🇷🇺',
      'MX': '🇲🇽',
      'ES': '🇪🇸',
      'IT': '🇮🇹'
    }
    
    return flagMap[countryCode] || null
  }
} 