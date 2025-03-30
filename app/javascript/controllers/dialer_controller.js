import { Controller } from "@hotwired/stimulus"

/**
 * Dialer controller for handling dialer functionality
 */
export default class extends Controller {
  static targets = ["input"]
  // Define an outlet for the phone-input controller
  static outlets = [ "phone-input" ]

  connect() {
    console.log("Dialer controller connected", this.element)
  }
  
  // Optional: Callback when the outlet connects
  phoneInputOutletConnected(outlet, element) {
    console.log("Phone input outlet connected:", outlet, element)
  }

  /**
   * Add a key press to the input field
   * @param {Event} event - The click event
   */
  addKey(event) {
    console.log("--- dialer#addKey START ---")
    console.log("addKey called with:", event.currentTarget.dataset.dialerKey)
    event.preventDefault() // Prevent default button behavior

    const key = event.currentTarget.dataset.dialerKey
    const input = this.inputTarget
    
    // Add the key to the input value at the current cursor position
    const cursorPos = input.selectionStart || input.value.length
    const before = input.value.substring(0, cursorPos)
    const after = input.value.substring(cursorPos)
    input.value = before + key + after
    
    // Set the cursor position after the inserted character
    const newCursorPos = cursorPos + 1
    input.setSelectionRange(newCursorPos, newCursorPos)
    
    // Force focus on the input
    input.focus()
    
    // --- Use Outlet for Communication --- 
    if (this.hasPhoneInputOutlet) {
      console.log("Calling handleInput via phoneInputOutlet")
      this.phoneInputOutlet.handleInput()
    } else {
      console.error("phoneInputOutlet is not connected in addKey")
    }
    // --- End Outlet Communication ---
    console.log("--- dialer#addKey END ---")
  }

  /**
   * Clear the input field
   */
  clear() {
    this.inputTarget.value = ""
    // Ensure state is updated after clearing via outlet
    if (this.hasPhoneInputOutlet) {
      this.phoneInputOutlet.handleInput()
    } else {
      console.error("phoneInputOutlet is not connected in clear")
    }
  }
} 