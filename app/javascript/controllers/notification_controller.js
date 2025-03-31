import { Controller } from "@hotwired/stimulus"

/**
 * Notification controller to handle various notifications and alerts
 * Manages showing/hiding, auto-dismiss, and animation
 */
export default class extends Controller {
  static targets = ["notification", "content", "progress", "dismiss"]
  static values = {
    autoHide: { type: Boolean, default: true },
    duration: { type: Number, default: 5000 },
    type: { type: String, default: "info" }
  }

  connect() {
    this.show()
    
    if (this.autoHideValue) {
      this.autoDismissTimeout = setTimeout(() => {
        this.hide()
      }, this.durationValue)
      
      // Start progress animation if there's a progress target
      if (this.hasProgressTarget) {
        this.progressTarget.style.transition = `width ${this.durationValue}ms linear`
        this.progressTarget.style.width = "0%"
        
        // Force a reflow to ensure the animation starts
        this.progressTarget.offsetHeight
        
        // Start animation
        requestAnimationFrame(() => {
          this.progressTarget.style.width = "100%"
        })
      }
    }
  }
  
  disconnect() {
    if (this.autoDismissTimeout) {
      clearTimeout(this.autoDismissTimeout)
    }
  }
  
  show() {
    this.notificationTarget.classList.remove("hidden")
    
    // Add entry animation class based on notification type
    if (this.typeValue === "banner") {
      this.notificationTarget.classList.add("animate-slide-down")
    } else {
      this.notificationTarget.classList.add("animate-fade-in")
    }
  }
  
  hide(event) {
    if (event) event.preventDefault()
    
    // Add exit animation class based on notification type
    if (this.typeValue === "banner") {
      this.notificationTarget.classList.add("animate-slide-up")
    } else {
      this.notificationTarget.classList.add("animate-fade-out")
    }
    
    // Wait for animation to complete before removing
    this.notificationTarget.addEventListener("animationend", () => {
      // If this is a toast notification, reposition other toasts when removed
      if (this.element.classList.contains('toast-notification')) {
        this.repositionOtherToasts()
      }
      this.element.remove()
    }, { once: true })
    
    if (this.autoDismissTimeout) {
      clearTimeout(this.autoDismissTimeout)
    }
  }
  
  repositionOtherToasts() {
    // Get all toast notifications
    const toasts = document.querySelectorAll('.toast-notification')
    
    // Skip if this is the only toast
    if (toasts.length <= 1) return
    
    // Find current toast's index
    let currentIndex = -1
    for (let i = 0; i < toasts.length; i++) {
      if (toasts[i] === this.element) {
        currentIndex = i
        break
      }
    }
    
    // Reposition toasts that come after this one
    if (currentIndex !== -1) {
      for (let i = currentIndex + 1; i < toasts.length; i++) {
        const toast = toasts[i]
        const currentTop = parseInt(toast.style.top || '0', 10)
        toast.style.transition = 'top 0.3s ease-out'
        toast.style.top = `${currentTop - 10}px` // Move up by the staggering offset
      }
    }
  }
} 