import { Controller } from "@hotwired/stimulus"

// This controller collects WebRTC statistics during a call and sends them to the server
export default class extends Controller {
  static targets = ["connection"]
  static values = {
    callId: Number,
    interval: { type: Number, default: 5000 } // 5 seconds between samples
  }
  
  connect() {
    if (!this.hasCallIdValue) {
      console.error("Call ID is required for call quality monitoring")
      return
    }
    
    this.statsTimer = null
    this.peerConnection = null
  }

  // Start monitoring call quality
  startMonitoring(event) {
    if (event.detail && event.detail.peerConnection) {
      this.peerConnection = event.detail.peerConnection
      
      // Start collecting stats periodically
      this.statsTimer = setInterval(() => {
        this.collectStats()
      }, this.intervalValue)
    }
  }
  
  // Stop monitoring and clean up
  stopMonitoring() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer)
      this.statsTimer = null
    }
    this.peerConnection = null
  }
  
  disconnect() {
    this.stopMonitoring()
  }
  
  // Collect WebRTC stats and send to server
  async collectStats() {
    if (!this.peerConnection) return
    
    try {
      const stats = await this.peerConnection.getStats()
      const metrics = this.processStats(stats)
      
      if (metrics) {
        this.sendMetricsToServer(metrics)
      }
    } catch (error) {
      console.error("Error collecting WebRTC stats:", error)
    }
  }
  
  // Process raw WebRTC stats into usable metrics
  processStats(stats) {
    let jitter = 0
    let packetLoss = 0
    let latency = 0
    let bitrate = 0
    let codec = ""
    let resolution = ""
    const rawData = {}
    
    stats.forEach(stat => {
      // Store all raw stats for debugging
      rawData[stat.id] = stat
      
      // Extract inbound RTP stats (audio/video)
      if (stat.type === "inbound-rtp" && !stat.isRemote) {
        jitter = Math.max(jitter, stat.jitter * 1000 || 0) // Convert to ms
        packetLoss = Math.max(packetLoss, stat.packetsLost || 0)
        
        if (stat.kind === "video") {
          resolution = `${stat.frameWidth}x${stat.frameHeight}`
        }
      }
      
      // Extract codec info
      if (stat.type === "codec") {
        codec = stat.mimeType || codec
      }
      
      // Extract round-trip time
      if (stat.type === "remote-candidate") {
        latency = Math.max(latency, stat.roundTripTime || 0)
      }
      
      // Extract bitrate from transport stats
      if (stat.type === "transport") {
        const bytesSent = stat.bytesSent || 0
        const bytesReceived = stat.bytesReceived || 0
        
        if (stat.timestamp && this.lastTimestamp && this.lastBytesSent && this.lastBytesReceived) {
          const timeDiff = stat.timestamp - this.lastTimestamp
          const byteDiff = (bytesSent + bytesReceived) - (this.lastBytesSent + this.lastBytesReceived)
          
          if (timeDiff > 0) {
            bitrate = Math.floor((byteDiff * 8) / timeDiff) // bps
          }
        }
        
        this.lastTimestamp = stat.timestamp
        this.lastBytesSent = bytesSent
        this.lastBytesReceived = bytesReceived
      }
    })
    
    // Calculate packet loss percentage (if we have total packets)
    let packetLossPercent = 0
    stats.forEach(stat => {
      if (stat.type === "inbound-rtp" && !stat.isRemote && stat.packetsReceived > 0) {
        const totalExpected = stat.packetsReceived + (stat.packetsLost || 0)
        if (totalExpected > 0) {
          packetLossPercent = Math.max(
            packetLossPercent, 
            ((stat.packetsLost || 0) / totalExpected) * 100
          )
        }
      }
    })
    
    return {
      jitter,
      packet_loss: packetLossPercent,
      latency,
      bitrate,
      codec,
      resolution,
      raw_data: rawData
    }
  }
  
  // Send collected metrics to server
  sendMetricsToServer(metrics) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
    
    fetch(`/api/calls/${this.callIdValue}/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ metrics })
    }).catch(error => {
      console.error("Error sending metrics to server:", error)
    })
  }
} 