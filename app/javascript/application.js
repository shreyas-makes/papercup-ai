// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails";
import "@hotwired/stimulus";
import "@hotwired/stimulus-loading";
import "@rails/actioncable";
import "controllers";
import "channels";
import "chartkick";
import "Chart.bundle";
import "flowbite"

import * as ActiveStorage from "@rails/activestorage";
ActiveStorage.start();
import "trix";
import "@rails/actiontext";

Trix.config.blockAttributes.heading2 = {
  tagName: "h2",
  terminal: true,
  breakOnReturn: true,
  group: false,
};

addEventListener("trix-initialize", (event) => {
  const { toolbarElement } = event.target;
  const h1Button = toolbarElement.querySelector("[data-trix-attribute=heading1]");
  h1Button.insertAdjacentHTML(
    "afterend",
    `
    <button type="button" class="trix-button trix-button--icon trix-button--icon-heading-2 flex justify-center" data-trix-attribute="heading2" title="Heading 2" tabindex="-1" data-trix-active="">
    </button>
  `
  );
});

Trix.config.blockAttributes.heading3 = {
  tagName: "h3",
  terminal: true,
  breakOnReturn: true,
  group: false,
};

addEventListener("trix-initialize", (event) => {
  const { toolbarElement } = event.target;
  const h2Button = toolbarElement.querySelector("[data-trix-attribute=heading2]");
  h2Button.insertAdjacentHTML(
    "afterend",
    `
    <button type="button" class="trix-button trix-button--icon trix-button--icon-heading-3 flex justify-center" data-trix-attribute="heading3" title="Heading 3" tabindex="-2" data-trix-active="">
    </button>
  `
  );
});

// Check if the user is logged in when page loads
document.addEventListener("turbo:load", async () => {
  console.log("Turbo load event fired - checking authentication");
  
  // First check if the user is already authenticated via Rails session
  const userLoggedIn = document.querySelector("meta[name='logged-in']")?.getAttribute("content") === "true";
  console.log("User logged in via Rails session:", userLoggedIn);
  
  if (userLoggedIn) {
    console.log("User is logged in via Rails session, setting auth token");
    
    try {
      // Get a JWT token for the already authenticated session user
      const response = await fetch("/api/v1/auth/login_from_session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").getAttribute("content")
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        console.log("Auth token set successfully from session:", data);
        
        // Dispatch authentication event
        document.dispatchEvent(new CustomEvent("papercup:authentication-changed", {
          detail: { isAuthenticated: true, user: data.user }
        }));
        
        // Try to get user info to verify the token works
        try {
          const userResponse = await fetch("/api/v1/auth/me", {
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").getAttribute("content")
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log("User info retrieved successfully:", userData);
          } else {
            console.error("Failed to get user info:", userResponse.status, userResponse.statusText);
            console.log("Response headers:", Object.fromEntries([...userResponse.headers.entries()]));
            
            // Log the response body for debugging
            try {
              const errorText = await userResponse.text();
              console.error("Error response:", errorText);
            } catch (e) {
              console.error("Could not read error response body");
            }
          }
        } catch (error) {
          console.error("Error setting auth token:", error);
        }
      } else {
        console.error("Failed to get token from session:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error setting auth token:", error);
    }
  }
});

// Debug all Stimulus controller connections
document.addEventListener("stimulus:connect", (event) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Stimulus controller connected: ${event.detail.controller.identifier}`);
  }
});
