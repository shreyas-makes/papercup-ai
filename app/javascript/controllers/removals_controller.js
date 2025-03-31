import { Controller } from "@hotwired/stimulus"

/**
 * Simple controller to remove an element
 * Can be triggered by various events
 */
export default class extends Controller {
  remove() {
    this.element.remove()
  }
} 