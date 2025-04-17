// API Service for Papercup
// Handles all API calls to the backend
import mockApi, { historyApi } from './mockApi';
console.log("LOADING API SERVICE...");

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    } catch (e) {
      // If parsing fails, throw a generic error with status
      throw new Error(`API error: ${response.status}`);
    }
  }
  
  // Parse JSON response
  try {
    return await response.json();
  } catch (e) {
    // Return empty object if no JSON content
    return {};
  }
};

// Helper function to get CSRF token
const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Helper function to get auth headers
const getHeaders = () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};

const api = {
  // Authentication
  async login(email, password) {
    console.log('Attempting login with email:', email);
    const response = await fetch('/users/sign_in', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        user: {
          email, 
          password
        }
      })
    });
    const data = await handleResponse(response);
    if (data.token) {
      console.log('Login successful, setting auth token');
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },
  
  async logout() {
    localStorage.removeItem('auth_token');
    const response = await fetch('/users/sign_out', {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Calls
  async initiateCall(phoneNumber, countryCode) {
    console.log(`Initiating call to ${phoneNumber} (${countryCode})`);
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        call: {
          phone_number: phoneNumber, 
          country_code: countryCode
        }
      })
    });
    return handleResponse(response);
  },
  
  async getCallStatus(callId) {
    const response = await fetch(`/api/calls/${callId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  async endCall(callId) {
    const response = await fetch(`/api/calls/${callId}/terminate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Credits
  async getBalance() {
    const response = await fetch('/api/credits/balance', {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  async addCredits(amount) {
    const response = await fetch('/api/credits/create_checkout_session', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    return handleResponse(response);
  },
  
  // History
  async getHistory() {
    const response = await fetch('/api/credits', {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Call History
  async getCalls(page = 1, limit = 10) {
    console.log(`Fetching call history - page: ${page}, limit: ${limit}`);
    
    try {
      // Always use mock data during development
      console.log("Using historyApi.getCalls for mock data");
      return await historyApi.getCalls(page, limit);
      
      // The code below is temporarily disabled
      // Check if user is authenticated
      const isAuthenticated = document.querySelector("meta[name='logged-in']")?.getAttribute("content") === "true";
      console.log("Is authenticated according to meta tag:", isAuthenticated);
      
      if (!isAuthenticated) {
        console.warn("User not authenticated in API service, using mock data");
        return mockApi.getCalls(page, limit);
      }
      
      const url = `/api/calls?page=${page}&limit=${limit}`;
      console.log(`Request URL: ${url}`);
      
      const headers = getHeaders();
      console.log('Request headers:', headers);
      
      const response = await fetch(url, { headers });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        console.error(`Error fetching call history: ${response.status} ${response.statusText}`);
        
        // Try to read the error response
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Could not read error response");
        }
        
        console.log("Falling back to mock data due to API error");
        return mockApi.getCalls(page, limit);
      }
      
      const data = await response.json();
      console.log('Call history data received:', data);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log("No real calls found, using mock data to show UI example");
        return mockApi.getCalls(page, limit);
      }
      
      return data;
    } catch (error) {
      console.error('Exception during call history fetch:', error);
      console.log("Using mock data due to exception");
      return mockApi.getCalls(page, limit);
    }
  },
  
  // WebRTC
  async getWebRTCToken() {
    const response = await fetch('/api/webrtc/token', {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Add a new method to check Twilio status directly
  async getDirectTwilioStatus(twilioSid) {
    const response = await this.get(`/api/calls/twilio_status?sid=${twilioSid}`);
    return response;
  },
}; 

// Log that the API service is ready
console.log("API SERVICE LOADED", api, historyApi);

// Add this line to export the api object as default
export default api; 