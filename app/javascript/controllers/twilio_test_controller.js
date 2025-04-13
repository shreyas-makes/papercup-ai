import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

export default class extends Controller {
  static targets = ["phone", "status"]

  async testCall() {
    try {
      const phoneNumber = this.phoneTarget.value
      if (!phoneNumber) {
        this.statusTarget.textContent = "Please enter a phone number"
        return
      }

      this.statusTarget.textContent = "Initiating test call..."

      // Create a test call
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          call: {
            phone_number: phoneNumber,
            country_code: '+1',
            status: 'initiated'
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        this.statusTarget.textContent = "✅ Call initiated successfully!\n" +
          "Call ID: " + data.id + "\n" +
          "Status: " + data.status
          
        // Poll for call status updates
        this.pollCallStatus(data.id)
      } else {
        this.statusTarget.textContent = "❌ Call initiation failed: " + data.error
      }
    } catch (error) {
      this.statusTarget.textContent = "❌ Call test failed: " + error.message
      console.error('Call test error:', error)
    }
  }

  async pollCallStatus(callId) {
    try {
      const response = await fetch(`/api/calls/${callId}`)
      const data = await response.json()

      const status = data.status
      this.statusTarget.textContent = "Call Status: " + status + "\n" +
        "Duration: " + (data.duration || 0) + " seconds"

      if (['completed', 'failed', 'terminated'].includes(status)) {
        return
      }

      // Simulate proper status progression
      const testStatuses = {
        'initiated': 'ringing',
        'ringing': 'answered',
        'answered': 'completed'
      };

      // Continue polling every 2 seconds
      setTimeout(() => this.pollCallStatus(callId), 2000)
    } catch (error) {
      console.error('Error polling call status:', error)
    }
  }
} 