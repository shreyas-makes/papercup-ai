import { Controller } from "@hotwired/stimulus"

/**
 * Debug panel controller for development testing
 * This panel will be hidden in production
 */
export default class extends Controller {
  static targets = ["creditInput", "errorTypeSelect", "panel"]
  static values = {
    environment: String
  }
  
  connect() {
    // Hide in production environment
    if (this.environmentValue === "production") {
      this.panelTarget.classList.add("hidden")
      return
    }
    
    // Add keyboard shortcut (Shift+Ctrl+D) to toggle panel
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    
    console.log("Debug panel controller connected")
    
    // Log all custom events
    const eventTypes = [
      'papercup:login',
      'papercup:logout',
      'papercup:call-started',
      'papercup:call-ended',
      'papercup:call-status-changed',
      'papercup:credits-updated',
      'papercup:show-notification',
      'papercup:show-modal',
      'papercup:hide-modal',
      'papercup:show-toast',
      'papercup:state-update'
    ]
    
    eventTypes.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        console.log(`EVENT FIRED: ${eventType}`, event.detail)
      })
    })
    
    // Add click debugging for all buttons
    document.addEventListener('click', (event) => {
      if (event.target.closest('button')) {
        const button = event.target.closest('button')
        console.log('Button clicked:', button)
        console.log('Button data attributes:', button.dataset)
      }
    }, true)
  }
  
  disconnect() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
  }
  
  handleKeyDown(event) {
    // Toggle debug panel with Shift+Ctrl+D
    if (event.shiftKey && event.ctrlKey && event.key === 'D') {
      event.preventDefault()
      this.togglePanel()
    }
  }
  
  togglePanel() {
    this.panelTarget.classList.toggle("hidden")
  }
} 