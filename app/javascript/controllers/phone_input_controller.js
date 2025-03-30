import { Controller } from "@hotwired/stimulus"

/**
 * Phone input controller for handling phone number input and validation
 */
export default class extends Controller {
  static targets = ["input", "clearButton", "validationIndicator"]

  connect() {
    console.log("Phone input controller connected")
    this.updateClearButtonVisibility()
  }

  /**
   * Handle input changes to format the phone number and show/hide the clear button
   */
  handleInput(event) {
    console.log("--- phone_input#handleInput START ---")
    console.log("Input event triggered", this.inputTarget.value)
    this.formatPhoneNumber()
    this.updateClearButtonVisibility()
    this.validatePhoneNumber()
    console.log("--- phone_input#handleInput END ---")
  }

  /**
   * Format the phone number as the user types
   */
  formatPhoneNumber() {
    const input = this.inputTarget
    
    // Store original values before formatting
    const originalValue = input.value
    const originalCursorPos = input.selectionStart || 0
    
    // Count digits before cursor in original value
    let digitsBeforeCursor = 0
    for (let i = 0; i < originalCursorPos; i++) {
      if (/\d/.test(originalValue[i])) {
        digitsBeforeCursor++
      }
    }
    
    // Get the raw digit value (remove existing formatting)
    const rawValue = originalValue.replace(/\D/g, "")
    console.log("Raw value:", rawValue)
    
    // Apply more sophisticated formatting for better readability
    let formattedValue = rawValue
    if (rawValue.length > 0) {
      // Apply different formatting based on length
      if (rawValue.length <= 3) {
        // Just the raw digits for short numbers
        formattedValue = rawValue
      } else if (rawValue.length <= 6) {
        // Format as XXX XXX
        formattedValue = rawValue.replace(/(\d{3})(\d+)/, "$1 $2")
      } else if (rawValue.length <= 10) {
        // Format as XXX XXX XXXX for standard numbers
        formattedValue = rawValue.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")
      } else {
        // For longer international numbers, group in threes
        formattedValue = rawValue.replace(/(\d{3})(?=\d)/g, "$1 ")
      }
    }
    
    console.log("Formatted value:", formattedValue)
    
    // Only update if the value changed
    if (formattedValue !== originalValue) {
      // Update the input value
      input.value = formattedValue
      
      // Determine new cursor position
      if (digitsBeforeCursor === 0) {
        // If cursor was at the beginning, keep it there
        input.setSelectionRange(0, 0)
      } else if (digitsBeforeCursor === rawValue.length) {
        // If cursor was at the end, keep it at the end
        input.setSelectionRange(formattedValue.length, formattedValue.length)
      } else {
        // Otherwise, count digits in formatted value to find the right position
        let newCursorPos = 0
        let digitCount = 0
        
        for (let i = 0; i < formattedValue.length; i++) {
          if (/\d/.test(formattedValue[i])) {
            digitCount++
            if (digitCount > digitsBeforeCursor) {
              break
            }
          }
          newCursorPos = i + 1
        }
        
        input.setSelectionRange(newCursorPos, newCursorPos)
      }
    }
  }

  /**
   * Show or hide the clear button based on input content
   */
  updateClearButtonVisibility() {
    if (this.hasClearButtonTarget) {
      if (this.inputTarget.value.length > 0) {
        this.clearButtonTarget.classList.remove("hidden")
      } else {
        this.clearButtonTarget.classList.add("hidden")
      }
    }
  }

  /**
   * Clear the input field
   */
  clear() {
    this.inputTarget.value = ""
    this.updateClearButtonVisibility()
    this.validatePhoneNumber()
    this.inputTarget.focus()
  }

  /**
   * Basic validation of the phone number
   * Shows a visual indicator if the number is valid or invalid
   */
  validatePhoneNumber() {
    if (!this.hasValidationIndicatorTarget) return
    
    const phoneNumber = this.inputTarget.value.replace(/\D/g, "")
    
    if (phoneNumber.length === 0) {
      // Empty input - no validation
      this.validationIndicatorTarget.classList.remove("bg-success", "bg-error")
      this.validationIndicatorTarget.classList.add("bg-background")
      return
    }
    
    // Check both minimum and maximum length
    // Most international phone numbers are between 7 and 15 digits
    // according to the ITU-T E.164 standard
    const minLength = 7
    const maxLength = 15
    const isValid = phoneNumber.length >= minLength && phoneNumber.length <= maxLength
    
    if (isValid) {
      this.validationIndicatorTarget.classList.remove("bg-background", "bg-error")
      this.validationIndicatorTarget.classList.add("bg-success")
    } else {
      this.validationIndicatorTarget.classList.remove("bg-background", "bg-success")
      this.validationIndicatorTarget.classList.add("bg-error")
    }
  }
} 