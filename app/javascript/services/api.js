// API Service for Papercup
// Handles all API calls to the backend

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

// Helper function to get CSRF token
const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Helper function to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const api = {
  // Authentication
  async login(email, password) {
    console.log('Attempting login with email:', email);
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
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
    return { success: true };
  },
  
  // Calls
  async initiateCall(phoneNumber, countryCode) {
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone_number: phoneNumber, country_code: countryCode })
    });
    return handleResponse(response);
  },
  
  async endCall(callId) {
    const response = await fetch(`/api/calls/${callId}`, {
      method: 'DELETE',
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
  
  async purchaseCredits(packageId) {
    try {
      console.log('Purchasing credits with package ID:', packageId);
      const response = await fetch('/api/credits/create_checkout_session', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ package_id: packageId })
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Purchase credits failed:', error);
      throw error;
    }
  },
  
  // History
  async getHistory() {
    const response = await fetch('/api/credits', {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // WebRTC
  async getWebRTCToken() {
    const response = await fetch('/api/webrtc/token', {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
}; 

// Add this line to export the api object as default
export default api; 