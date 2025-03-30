import { Controller } from "@hotwired/stimulus"

/**
 * Country selector controller for handling country selection
 * Provides a searchable dropdown with country flags and dial codes
 */
export default class extends Controller {
  // Add countryListContainer target
  static targets = [
    "dropdown", "button", "search", "selectedFlag", 
    "selectedCode", "phoneInput", "countryListContainer"
  ]
  static values = {
    open: Boolean,
    selected: { type: String, default: "US" }
  }

  connect() {
    // Read countries data from the script tag
    const dataElement = document.getElementById('countries-data');
    try {
      this.allCountries = JSON.parse(dataElement?.textContent || '[]');
    } catch (e) {
      console.error("Failed to parse countries data from script tag:", e);
      this.allCountries = [];
    }
    
    // Initial render of all countries
    this._renderCountries(this.allCountries);
    
    // Default to US on connect
    this.selectCountry("US")
    
    // Close dropdown when clicking outside
    document.addEventListener("click", this.closeIfClickedOutside.bind(this))
    console.log("Country selector connected, countries loaded:", this.allCountries.length)
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
      // Ensure list is up-to-date when opened
      this.search() 
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
   * Filter countries based on search input and re-render the list
   */
  search() {
    const query = this.searchTarget.value.toLowerCase().trim();
    let filteredCountries = this.allCountries;

    if (query) {
      filteredCountries = this.allCountries.filter(country => {
        const name = country.name.toLowerCase();
        const code = country.code.toLowerCase();
        const dialCode = country.dial_code.toLowerCase();
        return name.includes(query) || code.includes(query) || dialCode.includes(query);
      });
    }
    
    this._renderCountries(filteredCountries);
  }

  /**
   * Select a country and update the UI
   * @param {String|Event} countryOrEvent - The country code or click event
   */
  selectCountry(countryOrEvent) {
    let countryCode;
    
    if (typeof countryOrEvent === "string") {
      countryCode = countryOrEvent;
    } else {
      countryCode = countryOrEvent.currentTarget.dataset.countryCode; // Use consistent data attribute
      this.close();
    }
    
    const country = this.allCountries.find(c => c.code === countryCode) || 
                    this.allCountries.find(c => c.code === "US") || // Fallback to US
                    { code: "US", flag: "🇺🇸", dial_code: "+1", name: "United States" }; // Absolute fallback
    
    if (!country) return;
    
    this.selectedValue = country.code;
    this.selectedFlagTarget.textContent = country.flag || '🏳️';
    this.selectedCodeTarget.textContent = country.dial_code;
    
    // Update phone input placeholder and potentially format number
    // Placeholder logic might need country-specific examples
    this.phoneInputTarget.placeholder = `(${country.dial_code.replace('+', '')}) ...`; 
    // this.formatPhoneNumber(); // Optional: reformat on country change
  }
  
  /**
   * Renders the list of country buttons in the dropdown
   * @param {Array} countriesToRender - Array of country objects to render
   */
  _renderCountries(countriesToRender) {
    if (!this.hasCountryListContainerTarget) {
      console.error("Country list container target not found!");
      return;
    }

    this.countryListContainerTarget.innerHTML = ''; // Clear previous list

    if (countriesToRender.length === 0) {
      this.countryListContainerTarget.innerHTML = '<p class="p-3 text-sm text-text-secondary text-center">No matching countries found.</p>';
      return;
    }

    countriesToRender.forEach(country => {
      const element = document.createElement('button');
      element.className = 'w-full px-3 py-2 flex items-center hover:bg-[#F5F5F5] transition-colors text-left';
      element.dataset.action = 'click->country-selector#selectCountry';
      element.dataset.countryCode = country.code; // Consistent attribute name
      element.dataset.name = country.name;
      element.dataset.dialCode = country.dial_code;
      
      element.innerHTML = `
        <span class="text-lg mr-2">${country.flag || '🏳️'}</span>
        <span class="flex-1">${country.name} (${country.code})</span>
        <span class="text-sm font-medium text-text-secondary ml-2">${country.dial_code}</span>
      `;
      
      this.countryListContainerTarget.appendChild(element);
    });
  }

  // Removed formatPhoneNumber() as it wasn't fully implemented and might be better handled by phone-input controller
}