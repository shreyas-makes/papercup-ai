import { Controller } from "@hotwired/stimulus"

/**
 * Phone input controller for handling phone number input
 */
export default class extends Controller {
  static targets = ["input", "clearButton", "validationIndicator"]

  connect() {
    console.log("Phone input controller connected")
    this.validateNumber()
  }

  // Add a key to the input (from keypad)
  addKey(key) {
    if (!this.hasInputTarget) return
    
    const input = this.inputTarget
    const currentValue = input.value
    
    // Handle special keys
    if (key === "*") {
      if (currentValue === "" || currentValue.slice(-1) !== "*") {
        input.value = currentValue + "*"
      }
    } else if (key === "#") {
      input.value = currentValue + "#"
    } else {
      // Normal numeric keys
      input.value = currentValue + key
    }
    
    this.validateNumber()
    this.showClearButton()
  }
  
  // Clear the input
  clear() {
    if (!this.hasInputTarget) return
    
    this.inputTarget.value = ""
    this.validateNumber()
    this.hideClearButton()
  }
  
  // Handle manual input
  handleInput() {
    this.validateNumber()
    
    if (this.inputTarget.value) {
      this.showClearButton()
    } else {
      this.hideClearButton()
    }
  }
  
  // Show clear button
  showClearButton() {
    if (this.hasClearButtonTarget) {
      this.clearButtonTarget.classList.remove("hidden")
    }
  }
  
  // Hide clear button
  hideClearButton() {
    if (this.hasClearButtonTarget) {
      this.clearButtonTarget.classList.add("hidden")
    }
  }
  
  // Validate the phone number
  validateNumber() {
    if (!this.hasInputTarget || !this.hasValidationIndicatorTarget) return
    
    const input = this.inputTarget
    const value = input.value.trim()
    
    // Simple validation - must be at least 5 characters
    const isValid = value.length >= 5
    
    // Update validation indicator
    if (isValid) {
      this.validationIndicatorTarget.classList.add("bg-success")
      this.validationIndicatorTarget.classList.remove("bg-background")
    } else {
      this.validationIndicatorTarget.classList.remove("bg-success")
      this.validationIndicatorTarget.classList.add("bg-background")
    }
    
    return isValid
  }
} 