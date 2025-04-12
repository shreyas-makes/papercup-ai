import { Controller } from "@hotwired/stimulus"
import Chart from "chart.js/auto"

// This controller handles analytics charts
export default class extends Controller {
  static targets = ["canvas"]
  static values = {
    type: String,
    url: String,
    startDate: String,
    endDate: String
  }
  
  connect() {
    if (!this.hasCanvasTarget) return
    
    // Initialize chart as null
    this.chart = null
    
    // Load data and create chart
    this.fetchDataAndRender()
  }
  
  disconnect() {
    // Clean up chart when controller disconnects
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  }
  
  // When date range is updated
  refreshData(event) {
    // Update date range values if provided
    if (event && event.detail) {
      this.startDateValue = event.detail.startDate || this.startDateValue
      this.endDateValue = event.detail.endDate || this.endDateValue
    }
    
    // Fetch and render with new date range
    this.fetchDataAndRender()
  }
  
  // Fetch data from API and render chart
  async fetchDataAndRender() {
    try {
      // Prepare query params
      const params = new URLSearchParams()
      if (this.hasStartDateValue) params.append('start_date', this.startDateValue)
      if (this.hasEndDateValue) params.append('end_date', this.endDateValue)
      
      // Build URL
      const url = `${this.urlValue}?${params.toString()}`
      
      // Fetch data from API
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      this.renderChart(data)
    } catch (error) {
      console.error("Error fetching chart data:", error)
      this.renderError()
    }
  }
  
  // Render the appropriate chart based on type
  renderChart(data) {
    // Clean up existing chart if any
    if (this.chart) {
      this.chart.destroy()
    }
    
    // Select chart type to render
    switch (this.typeValue) {
      case 'call_volume':
        this.renderCallVolumeChart(data)
        break
      case 'call_quality':
        this.renderCallQualityChart(data)
        break
      case 'revenue':
        this.renderRevenueChart(data)
        break
      case 'destinations':
        this.renderDestinationsChart(data)
        break
      case 'users':
        this.renderUsersChart(data)
        break
      default:
        console.error(`Unknown chart type: ${this.typeValue}`)
        this.renderError()
    }
  }
  
  // Render call volume chart
  renderCallVolumeChart(data) {
    const ctx = this.canvasTarget.getContext('2d')
    
    // Prepare data for chart
    const labels = Object.keys(data.volume).map(date => {
      return new Date(date).toLocaleDateString()
    })
    
    const values = Object.values(data.volume)
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Call Volume',
          data: values,
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Calls'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    })
  }
  
  // Render call quality chart
  renderCallQualityChart(data) {
    const ctx = this.canvasTarget.getContext('2d')
    
    // Extract dates and metrics
    const labels = data.daily.map(item => new Date(item.date).toLocaleDateString())
    const jitterData = data.daily.map(item => item.metrics.avg_jitter || 0)
    const packetLossData = data.daily.map(item => item.metrics.avg_packet_loss || 0)
    const latencyData = data.daily.map(item => item.metrics.avg_latency || 0)
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Jitter (ms)',
            data: jitterData,
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Packet Loss (%)',
            data: packetLossData,
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            borderColor: 'rgba(220, 38, 38, 1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Latency (ms)',
            data: latencyData,
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    })
  }
  
  // Render revenue chart
  renderRevenueChart(data) {
    const ctx = this.canvasTarget.getContext('2d')
    
    // Prepare data for chart
    const labels = Object.keys(data.daily).map(date => {
      return new Date(date).toLocaleDateString()
    })
    
    // Convert cents to dollars for display
    const values = Object.values(data.daily).map(cents => cents / 100)
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue ($)',
          data: values,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Revenue ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    })
  }
  
  // Render destinations chart
  renderDestinationsChart(data) {
    const ctx = this.canvasTarget.getContext('2d')
    
    // Prepare data for chart
    const labels = data.map(item => item.country_code)
    const values = data.map(item => item.call_count)
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Call Destinations',
          data: values,
          backgroundColor: [
            'rgba(79, 70, 229, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(220, 38, 38, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(251, 146, 60, 0.6)',
            'rgba(52, 211, 153, 0.6)',
            'rgba(239, 68, 68, 0.6)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    })
  }
  
  // Render users chart
  renderUsersChart(data) {
    const ctx = this.canvasTarget.getContext('2d')
    
    // Prepare data for chart
    const labels = Object.keys(data.new_users).map(date => {
      return new Date(date).toLocaleDateString()
    })
    
    const values = Object.values(data.new_users)
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: values,
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 2,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'User Count'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    })
  }
  
  // Render error message when chart fails to load
  renderError() {
    const ctx = this.canvasTarget.getContext('2d')
    ctx.clearRect(0, 0, this.canvasTarget.width, this.canvasTarget.height)
    
    ctx.font = '16px Work Sans, sans-serif'
    ctx.fillStyle = '#EF4444'
    ctx.textAlign = 'center'
    ctx.fillText('Error loading chart data', this.canvasTarget.width / 2, this.canvasTarget.height / 2)
  }
} 