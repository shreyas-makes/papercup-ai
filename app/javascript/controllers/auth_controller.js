import { Controller } from "@hotwired/stimulus";
import api from "../services/api";

// Authentication controller for handling login and registration
export default class extends Controller {
  static targets = ["email", "password", "form", "error"];
  
  connect() {
    console.log("Auth controller connected");
    // Check if user is already logged in
    const token = localStorage.getItem("auth_token");
    console.log("Existing auth token:", token);
    if (token) {
      this.redirectToDashboard();
    }
  }
  
  // Handle form submission
  async submit(event) {
    event.preventDefault();
    
    const email = this.emailTarget.value.trim();
    const password = this.passwordTarget.value;
    
    console.log("Login attempt with email:", email);
    
    if (!email || !password) {
      this.showError("Please enter both email and password");
      return;
    }
    
    try {
      // Show loading state
      this.showLoading();
      
      // Attempt login
      const data = await api.login(email, password);
      console.log("Login response:", data);
      
      // Redirect to dashboard on success
      this.redirectToDashboard();
    } catch (error) {
      console.error("Login error:", error);
      this.showError(error.message || "Login failed. Please try again.");
    } finally {
      this.hideLoading();
    }
  }
  
  // Handle logout
  async logout(event) {
    event.preventDefault();
    
    try {
      // Show loading state
      this.showLoading();
      
      // Attempt logout
      await api.logout();
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect to login page even if logout fails
      window.location.href = "/login";
    }
  }
  
  // Redirect to dashboard
  redirectToDashboard() {
    console.log("Redirecting to dashboard");
    window.location.href = "/dashboard";
  }
  
  // Show loading state
  showLoading() {
    const submitButton = this.formTarget.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `;
    }
  }
  
  // Hide loading state
  hideLoading() {
    const submitButton = this.formTarget.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  }
  
  // Show error message
  showError(message) {
    if (this.errorTarget) {
      this.errorTarget.textContent = message;
      this.errorTarget.classList.remove("hidden");
    }
  }
} 