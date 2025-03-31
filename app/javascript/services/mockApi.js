/**
 * Mock API Service
 * 
 * Simulates backend API endpoints with realistic delays and response patterns
 * Uses localStorage for persistence
 */

// Helper function to simulate network delay
const delay = (ms = Math.floor(Math.random() * 200) + 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to simulate occasional random failures
const simulateRandomFailure = (failureRate = 0.1) => {
  return Math.random() < failureRate;
};

// Initialize mock data if not already present
const initializeMockData = () => {
  if (!localStorage.getItem('papercup_mock_user')) {
    localStorage.setItem('papercup_mock_user', JSON.stringify({
      id: 'mock-user-123',
      email: 'demo@example.com',
      name: 'Demo User'
    }));
  }

  if (!localStorage.getItem('papercup_mock_credits')) {
    localStorage.setItem('papercup_mock_credits', '25.00');
  }

  if (!localStorage.getItem('papercup_mock_calls')) {
    localStorage.setItem('papercup_mock_calls', JSON.stringify([]));
  }
  
  // Initialize authentication state if not set
  if (localStorage.getItem('papercup_auth') === null) {
    localStorage.setItem('papercup_auth', 'false');
  }
};

// Initialize on module load
initializeMockData();

// Authentication APIs
export const authApi = {
  checkAuth: async () => {
    await delay();
    
    const isAuthenticated = localStorage.getItem('papercup_auth') === 'true';
    const credits = parseFloat(localStorage.getItem('papercup_mock_credits') || '0');
    
    return {
      authenticated: isAuthenticated,
      credits: isAuthenticated ? credits : 0
    };
  },
  
  login: async (email, password) => {
    await delay();
    
    if (simulateRandomFailure()) {
      throw new Error('Authentication failed. Please try again.');
    }

    const user = JSON.parse(localStorage.getItem('papercup_mock_user'));
    const credits = parseFloat(localStorage.getItem('papercup_mock_credits'));
    
    // Set auth state to true
    localStorage.setItem('papercup_auth', 'true');
    
    return {
      success: true,
      user,
      credits,
      token: 'mock-auth-token-' + Math.random().toString(36).substring(2)
    };
  },

  logout: async () => {
    await delay();
    // Set auth state to false
    localStorage.setItem('papercup_auth', 'false');
    return { success: true };
  },

  getCurrentUser: async () => {
    await delay();
    const user = JSON.parse(localStorage.getItem('papercup_mock_user'));
    return { user };
  }
};

// Call operations API
export const callApi = {
  startCall: async (phoneNumber, countryCode) => {
    await delay();

    // Check if user has enough credits
    const credits = parseFloat(localStorage.getItem('papercup_mock_credits'));
    
    if (credits < 1) {
      throw new Error('Insufficient credits to make a call');
    }

    // Temporarily disable random failures for testing
    // if (simulateRandomFailure()) {
    //   throw new Error('Failed to establish call. Please try again.');
    // }

    // Generate a new call ID
    const callId = 'call-' + Date.now();
    
    // Create call record
    const newCall = {
      id: callId,
      phoneNumber,
      countryCode,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      durationSeconds: 0
    };

    // Store in mock calls history
    const calls = JSON.parse(localStorage.getItem('papercup_mock_calls') || '[]');
    calls.unshift(newCall);
    localStorage.setItem('papercup_mock_calls', JSON.stringify(calls));

    return {
      success: true,
      callId,
      status: 'active'
    };
  },

  endCall: async (callId) => {
    await delay();

    if (simulateRandomFailure()) {
      throw new Error('Failed to end call properly');
    }

    // Update call record
    const calls = JSON.parse(localStorage.getItem('papercup_mock_calls'));
    const callIndex = calls.findIndex(call => call.id === callId);
    
    if (callIndex === -1) {
      throw new Error('Call not found');
    }

    // Calculate duration and deduct credits
    const startTime = new Date(calls[callIndex].startTime);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    
    // Update call record
    calls[callIndex].status = 'ended';
    calls[callIndex].endTime = endTime.toISOString();
    calls[callIndex].durationSeconds = durationSeconds;
    
    // Update storage
    localStorage.setItem('papercup_mock_calls', JSON.stringify(calls));
    
    // Deduct credits (assume $0.01 per second for this mock)
    const creditsToDeduct = durationSeconds * 0.01;
    const currentCredits = parseFloat(localStorage.getItem('papercup_mock_credits'));
    const newCredits = Math.max(0, currentCredits - creditsToDeduct).toFixed(2);
    
    localStorage.setItem('papercup_mock_credits', newCredits);
    
    return {
      success: true,
      callId,
      status: 'ended',
      duration: durationSeconds,
      creditsUsed: creditsToDeduct,
      remainingCredits: parseFloat(newCredits)
    };
  },
  
  getCallStatus: async (callId) => {
    await delay();
    
    const calls = JSON.parse(localStorage.getItem('papercup_mock_calls'));
    const call = calls.find(call => call.id === callId);
    
    if (!call) {
      throw new Error('Call not found');
    }
    
    return {
      success: true,
      call
    };
  }
};

// Credit management API
export const creditApi = {
  getBalance: async () => {
    await delay();
    
    const credits = parseFloat(localStorage.getItem('papercup_mock_credits'));
    
    return {
      success: true,
      credits
    };
  },
  
  addCredits: async (amount) => {
    await delay();
    
    if (simulateRandomFailure()) {
      throw new Error('Payment processing failed. Please try again.');
    }
    
    const currentCredits = parseFloat(localStorage.getItem('papercup_mock_credits'));
    const newCredits = (currentCredits + amount).toFixed(2);
    
    localStorage.setItem('papercup_mock_credits', newCredits);
    
    return {
      success: true,
      previousBalance: currentCredits,
      newBalance: parseFloat(newCredits),
      added: amount
    };
  }
};

// Call history API
export const historyApi = {
  getCalls: async (page = 1, limit = 10) => {
    await delay();
    
    const calls = JSON.parse(localStorage.getItem('papercup_mock_calls') || '[]');
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCalls = calls.slice(startIndex, endIndex);
    
    return {
      success: true,
      calls: paginatedCalls,
      totalCalls: calls.length,
      page,
      totalPages: Math.ceil(calls.length / limit)
    };
  }
};

// Debug API (for development testing)
export const debugApi = {
  setCredits: async (amount) => {
    localStorage.setItem('papercup_mock_credits', amount.toFixed(2));
    return { success: true, newBalance: amount };
  },
  
  resetCalls: async () => {
    localStorage.setItem('papercup_mock_calls', JSON.stringify([]));
    return { success: true };
  },
  
  triggerError: async (errorType) => {
    await delay();
    
    switch (errorType) {
      case 'network':
        throw new Error('Network connection error');
      case 'server':
        throw new Error('Server error: 500 Internal Server Error');
      case 'auth':
        throw new Error('Authentication error: Token expired');
      default:
        throw new Error('Unknown error occurred');
    }
  }
}; 