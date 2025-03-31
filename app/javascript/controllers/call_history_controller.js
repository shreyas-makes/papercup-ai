import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list", "emptyState", "template"]

  connect() {
    // Mock call history data
    this.callHistory = [
      {
        id: 1,
        phoneNumber: "+1 (415) 555-2671",
        countryCode: "US",
        flag: "🇺🇸",
        timestamp: this.getRelativeTime(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
        duration: "5:12",
        status: "completed"
      },
      {
        id: 2,
        phoneNumber: "+44 20 7946 0958",
        countryCode: "GB",
        flag: "🇬🇧",
        timestamp: this.getRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000)), // 3 hours ago
        duration: "12:03",
        status: "completed"
      },
      {
        id: 3,
        phoneNumber: "+33 1 42 68 53 01",
        countryCode: "FR",
        flag: "🇫🇷",
        timestamp: this.getRelativeTime(new Date(Date.now() - 25 * 60 * 60 * 1000)), // Yesterday
        duration: "1:45",
        status: "completed"
      },
      {
        id: 4,
        phoneNumber: "+81 3 1234 5678",
        countryCode: "JP",
        flag: "🇯🇵",
        timestamp: this.getRelativeTime(new Date(Date.now() - 30 * 60 * 60 * 1000)), // Yesterday+
        duration: "0:00",
        status: "missed"
      },
      {
        id: 5,
        phoneNumber: "+49 30 1234 5678",
        countryCode: "DE",
        flag: "🇩🇪",
        timestamp: this.getRelativeTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
        duration: "8:22",
        status: "completed"
      }
    ]

    this.renderCallHistory()
  }

  renderCallHistory() {
    // Sort by most recent first
    const sortedCalls = [...this.callHistory].sort((a, b) => b.id - a.id)
    
    // Clear the list
    this.listTarget.innerHTML = ""

    if (sortedCalls.length === 0) {
      this.listTarget.classList.add("hidden")
      this.emptyStateTarget.classList.remove("hidden")
      return
    }

    this.listTarget.classList.remove("hidden")
    this.emptyStateTarget.classList.add("hidden")

    // Render each call history entry
    sortedCalls.forEach(call => {
      const entryElement = this.templateTarget.content.cloneNode(true)
      
      const callDetails = entryElement.querySelector(".call-details")
      const phoneNumber = entryElement.querySelector(".phone-number")
      const timestamp = entryElement.querySelector(".timestamp")
      const duration = entryElement.querySelector(".duration")
      const flag = entryElement.querySelector(".country-flag")
      const entryContainer = entryElement.querySelector(".call-entry")
      
      phoneNumber.textContent = call.phoneNumber
      timestamp.textContent = call.timestamp
      flag.textContent = call.flag
      
      // Set status-specific styling
      if (call.status === "missed") {
        duration.textContent = "Missed call"
        duration.classList.add("text-error")
      } else {
        duration.textContent = call.duration
      }
      
      // Set data attributes for redialing
      callDetails.dataset.phoneNumber = call.phoneNumber
      callDetails.dataset.countryCode = call.countryCode
      
      this.listTarget.appendChild(entryElement)
    })
  }

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
} 