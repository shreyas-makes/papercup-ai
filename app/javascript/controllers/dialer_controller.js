import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

/**
 * Dialer controller for making and managing calls
 */
export default class extends Controller {
  static targets = ["input"]
  static outlets = ["active-call", "phone-input"]

  connect() {
    console.log("Dialer controller connected")
    console.log("Has active-call outlet:", this.hasActiveCallOutlet)
    console.log("Has phone-input outlet:", this.hasPhoneInputOutlet)
    console.log("Has input target:", this.hasInputTarget)
    
    // Try to manually find the active call controller if outlet isn't connecting
    const activeCallController = document.getElementById('active-call-controller');
    console.log("Active call controller element found:", !!activeCallController)
  }

  // Handle key input from keypad
  addKey(event) {
    console.log("Dialer: addKey called with", event.currentTarget.dataset.dialerKey)
    const key = event.currentTarget.dataset.dialerKey
    if (this.hasInputTarget && this.phoneInputOutlet) {
      this.phoneInputOutlet.addKey(key)
    } else {
      console.error("Cannot add key: input target or phone-input outlet missing")
    }
  }
  
  // Initiate call with the current phone number
  async initiateCall() {
    console.log("Dialer: initiateCall called")
    
    if (!this.hasInputTarget) {
      console.error("Input target not found")
      return
    }
    
    const phoneNumber = this.inputTarget.value.trim()
    if (!phoneNumber) {
      alert("Please enter a phone number")
      return
    }
    
    // Get country code from the country selector
    const countryCodeElement = document.querySelector('[data-country-selector-target="selectedCode"]')
    const countryCode = countryCodeElement ? countryCodeElement.textContent.trim() : "GB"
    
    console.log(`Initiating call to ${phoneNumber} with country code ${countryCode}`)
    
    // Check if active call controller is available
    if (this.hasActiveCallOutlet) {
      console.log("Active call outlet found, calling startCall")
      try {
        // Start the call via the active call controller
        await this.activeCallOutlet.startCall(phoneNumber, countryCode)
      } catch (error) {
        console.error("Error initiating call:", error)
        alert("Failed to initiate call: " + (error.message || "Unknown error"))
      }
    } else {
      console.error("Active call outlet not found, trying direct API call")
      try {
        // Fall back to direct API call
        const result = await api.initiateCall(phoneNumber, countryCode)
        console.log("Call initiated directly with result:", result)
        alert("Call initiated! Check your phone. (Used direct API call)")
      } catch (error) {
        console.error("Error with direct API call:", error)
        alert("Failed to initiate call via direct API: " + (error.message || "Unknown error"))
      }
    }
  }
} 