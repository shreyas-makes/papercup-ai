import { Controller } from "@hotwired/stimulus"

/**
 * Country selector controller for handling country selection
 * Provides a searchable dropdown with country flags and dial codes
 */
export default class extends Controller {
  static targets = ["dropdown", "button", "search", "selectedFlag", "selectedCode", "phoneInput"]
  static values = {
    open: Boolean,
    selected: { type: String, default: "US" }
  }

  connect() {
    // Default to US on connect
    this.selectCountry("US")
    // Close dropdown when clicking outside
    document.addEventListener("click", this.closeIfClickedOutside.bind(this))
    console.log("Country selector connected")
  }

  disconnect() {
    document.removeEventListener("click", this.closeIfClickedOutside.bind(this))
  }

  /**
   * Toggle the dropdown visibility
   */
  toggle() {
    this.openValue = !this.openValue
    if (this.openValue) {
      this.dropdownTarget.classList.remove("hidden")
      this.searchTarget.focus()
    } else {
      this.dropdownTarget.classList.add("hidden")
    }
  }

  /**
   * Close the dropdown
   */
  close() {
    this.openValue = false
    this.dropdownTarget.classList.add("hidden")
  }

  /**
   * Close the dropdown if clicked outside of the component
   * @param {Event} event - The click event
   */
  closeIfClickedOutside(event) {
    if (this.openValue && !this.element.contains(event.target)) {
      this.close()
    }
  }

  /**
   * Filter countries based on search input
   */
  search() {
    const query = this.searchTarget.value.toLowerCase()
    const countryElements = this.dropdownTarget.querySelectorAll("[data-country]")
    
    countryElements.forEach(el => {
      const country = el.dataset.country.toLowerCase()
      const name = el.dataset.name.toLowerCase()
      const dialCode = el.dataset.dialCode.toLowerCase()
      
      if (country.includes(query) || name.includes(query) || dialCode.includes(query)) {
        el.classList.remove("hidden")
      } else {
        el.classList.add("hidden")
      }
    })
  }

  /**
   * Select a country and update the UI
   * @param {String|Event} countryOrEvent - The country code or click event
   */
  selectCountry(countryOrEvent) {
    let countryCode
    
    if (typeof countryOrEvent === "string") {
      countryCode = countryOrEvent
    } else {
      countryCode = countryOrEvent.currentTarget.dataset.country
      this.close()
    }
    
    // We need to either get the country from the client-side array or from the DOM
    let country
    
    // First try to get it from the DOM (the one rendered from the server)
    const countryElement = this.dropdownTarget.querySelector(`[data-country="${countryCode}"]`)
    if (countryElement) {
      country = {
        code: countryCode,
        flag: countryElement.querySelector('span').textContent,
        dial_code: countryElement.dataset.dialCode
      }
    } else {
      // Fall back to global window object data
      const countries = window.Papercup?.countries || []
      country = countries.find(c => c.code === countryCode) || 
                { code: "US", flag: "🇺🇸", dial_code: "+1" }
    }
    
    if (!country) return
    
    this.selectedValue = countryCode
    this.selectedFlagTarget.textContent = country.flag
    this.selectedCodeTarget.textContent = country.dial_code
    
    // Format any existing number with the new country code
    this.formatPhoneNumber()
  }

  /**
   * Format the phone number as the user types
   */
  formatPhoneNumber() {
    const input = this.phoneInputTarget
    let value = input.value.replace(/\D/g, "") // Remove non-digits
    
    if (value.length > 0) {
      // Basic formatting with spaces after every 3 digits
      // This is a simple implementation and should be expanded with country-specific formatting
      value = value.replace(/(\d{3})(?=\d)/g, "$1 ")
    }
    
    input.value = value
  }
} 