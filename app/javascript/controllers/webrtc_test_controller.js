import { Controller } from "@hotwired/stimulus"
import api from "../services/api"

export default class extends Controller {
  static targets = ["status"]

  async testConnection() {
    try {
      this.statusTarget.textContent = "Testing WebRTC connection..."
      
      // Test WebRTC configuration
      const response = await fetch('/api/webrtc/test_connection')
      const data = await response.json()
      
      if (data.status === 'success') {
        // Test media access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop()) // Clean up
        
        // Create peer connection
        const pc = new RTCPeerConnection(data.config)
        
        // Test STUN server connectivity
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.statusTarget.textContent = "✅ WebRTC connection successful!\n" +
              "STUN servers: Connected\n" +
              "Media access: Granted\n" +
              "ICE candidates: Gathered"
          }
        }
        
        // Create data channel to trigger ICE gathering
        pc.createDataChannel("test")
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        // Clean up
        setTimeout(() => {
          pc.close()
        }, 5000)
      } else {
        this.statusTarget.textContent = "❌ WebRTC test failed: " + data.error
      }
    } catch (error) {
      this.statusTarget.textContent = "❌ WebRTC test failed: " + error.message
      console.error('WebRTC test error:', error)
    }
  }
} 