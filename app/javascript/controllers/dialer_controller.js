import { Controller } from "@hotwired/stimulus"

/**
 * Dialer controller for handling dialer functionality
 */
export default class extends Controller {
  static targets = ["input"]

  connect() {
    console.log("Dialer controller connected")
  }

  /**
   * Add a key press to the input field
   * @param {Event} event - The click event
   */
  addKey(event) {
    const key = event.currentTarget.dataset.dialerKey
    const input = this.inputTarget
    input.value += key
  }

  /**
   * Clear the input field
   */
  clear() {
    this.inputTarget.value = ""
  }
} 