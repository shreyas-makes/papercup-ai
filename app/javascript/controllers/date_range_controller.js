import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["startDate", "endDate"]
  
  connect() {
    // Set default target references if not explicitly defined
    if (!this.hasStartDateTarget) {
      this.startDateTarget = this.element.querySelector('#start_date')
    }
    
    if (!this.hasEndDateTarget) {
      this.endDateTarget = this.element.querySelector('#end_date')
    }
  }
  
  // Update charts when form is submitted
  updateCharts(event) {
    // If this is a regular form submission (page reload), allow it to proceed normally
    if (!event.target.dataset.ajaxSubmit) {
      return
    }
    
    // Otherwise prevent the default form submission
    event.preventDefault()
    
    // Dispatch custom event to update charts with new date range
    const startDate = this.startDateTarget.value
    const endDate = this.endDateTarget.value
    
    // Use Stimulus dispatch to communicate with other controllers
    this.dispatch("dateRangeChanged", { 
      detail: { startDate, endDate } 
    })
    
    // Also find any chart controllers and call refreshData on them
    const chartControllers = document.querySelectorAll('[data-controller="analytics-chart"]')
    chartControllers.forEach(element => {
      // Use the Stimulus application to get the controller instance
      const controller = this.application.getControllerForElementAndIdentifier(
        element,
        'analytics-chart'
      )
      
      if (controller) {
        controller.refreshData({ detail: { startDate, endDate } })
      }
    })
  }
} 