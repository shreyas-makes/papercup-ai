import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["profileMenu"]

  connect() {
    // Close menu when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this))
  }

  disconnect() {
    document.removeEventListener('click', this.handleClickOutside.bind(this))
  }

  toggleProfileMenu(event) {
    event.preventDefault()
    event.stopPropagation()
    if (this.hasProfileMenuTarget) {
      this.profileMenuTarget.classList.toggle('hidden')
    }
  }

  handleClickOutside(event) {
    if (this.hasProfileMenuTarget && !this.element.contains(event.target)) {
      this.profileMenuTarget.classList.add('hidden')
    }
  }
}
