// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import { Application } from "@hotwired/stimulus"

// Enable debug mode in development
const application = Application.start()
application.debug = process.env.NODE_ENV !== "production"

// Configure Stimulus development experience
application.warnings = true
application.debug = process.env.NODE_ENV !== "production"
window.Stimulus = application

// Import and eager load all controllers
import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading"
eagerLoadControllersFrom("controllers", application)

// Export the application for use in controllers/index.js
export { application }
