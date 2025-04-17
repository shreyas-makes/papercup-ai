// Mock API for development and testing purposes
// Used to simulate backend responses before implementing real API endpoints

// Generate a random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper for simulating network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200));

// LocalStorage keys
const MOCK_CALL_HISTORY_KEY = 'papercup_mock_call_history';
const MOCK_CREDITS_KEY = 'papercup_mock_credits';
const MOCK_USER_KEY = 'papercup_mock_user';

// Generate mock call history if none exists
const initializeMockData = () => {
  // Initialize call history if none exists
  if (!localStorage.getItem(MOCK_CALL_HISTORY_KEY)) {
    const mockCalls = [];
    localStorage.setItem(MOCK_CALL_HISTORY_KEY, JSON.stringify(mockCalls));
  }
  
  // Initialize credits if none exist
  if (!localStorage.getItem(MOCK_CREDITS_KEY)) {
    localStorage.setItem(MOCK_CREDITS_KEY, JSON.stringify({
      balance: 1000,
      transactions: []
    }));
  }
  
  // Initialize user if none exists
  if (!localStorage.getItem(MOCK_USER_KEY)) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      id: 1,
      email: 'demo@papercup.com',
      name: 'Demo User',
      isAuthenticated: false
    }));
  }
};

// Initialize mock data
initializeMockData();

// Get mock data from localStorage
const getMockCallHistory = () => {
  const data = localStorage.getItem(MOCK_CALL_HISTORY_KEY);
  return JSON.parse(data || '[]');
};

const saveMockCallHistory = (calls) => {
  localStorage.setItem(MOCK_CALL_HISTORY_KEY, JSON.stringify(calls));
};

const getMockCredits = () => {
  const data = localStorage.getItem(MOCK_CREDITS_KEY);
  return JSON.parse(data || '{"balance": 1000, "transactions": []}');
};

const saveMockCredits = (credits) => {
  localStorage.setItem(MOCK_CREDITS_KEY, JSON.stringify(credits));
};

const getMockUser = () => {
  const data = localStorage.getItem(MOCK_USER_KEY);
  return JSON.parse(data || '{"isAuthenticated": false}');
};

const saveMockUser = (user) => {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
};

// API for call history operations
export const historyApi = {
  // Get call history with pagination
  async getCalls(page = 1, limit = 10) {
    await delay();
    
    // Simulate random errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Mock API error: Failed to fetch call history');
    }
    
    const calls = getMockCallHistory();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCalls = calls.slice(startIndex, endIndex);
    
    return {
      calls: paginatedCalls,
      page,
      totalPages: Math.ceil(calls.length / limit),
      total: calls.length
    };
  },
  
  // Add a new call to history
  async addCall(callData) {
    await delay();
    
    const calls = getMockCallHistory();
    const newCall = {
      id: generateUUID(),
      startTime: new Date().toISOString(),
      ...callData
    };
    
    // Add to beginning of array (most recent first)
    calls.unshift(newCall);
    saveMockCallHistory(calls);
    
    return newCall;
  },
  
  // Update a call (e.g., when it ends)
  async updateCall(callId, updateData) {
    await delay();
    
    const calls = getMockCallHistory();
    const callIndex = calls.findIndex(call => call.id === callId);
    
    if (callIndex === -1) {
      throw new Error('Call not found');
    }
    
    calls[callIndex] = {
      ...calls[callIndex],
      ...updateData
    };
    
    saveMockCallHistory(calls);
    
    return calls[callIndex];
  }
};

// API for call operations
export const callApi = {
  // Start a new call
  async startCall(phoneNumber, countryCode) {
    await delay();
    
    // Validate user has enough credits
    const credits = getMockCredits();
    if (credits.balance < 50) {
      throw new Error('Insufficient credits');
    }
    
    // Create a new call and add to history
    const newCall = await historyApi.addCall({
      phoneNumber,
      countryCode,
      direction: 'outgoing',
      status: 'connecting',
      cost: 0 // Will be updated when call ends
    });
    
    // Deduct credits for call setup
    credits.balance -= 10;
    credits.transactions.unshift({
      id: generateUUID(),
      type: 'debit',
      amount: 10,
      description: `Call setup to ${phoneNumber}`,
      timestamp: new Date().toISOString()
    });
    
    saveMockCredits(credits);
    
    return {
      callId: newCall.id,
      status: 'connecting'
    };
  },
  
  // End an ongoing call
  async endCall(callId) {
    await delay();
    
    // Update call status
    const call = await historyApi.updateCall(callId, {
      status: 'completed',
      endTime: new Date().toISOString(),
      durationSeconds: Math.floor(30 + Math.random() * 120) // Random duration between 30-150 seconds
    });
    
    // Calculate and deduct call cost
    const callCost = Math.floor(call.durationSeconds * 0.5); // 0.5 credits per second
    const credits = getMockCredits();
    
    credits.balance -= callCost;
    credits.transactions.unshift({
      id: generateUUID(),
      type: 'debit',
      amount: callCost,
      description: `Call to ${call.phoneNumber} (${call.durationSeconds}s)`,
      timestamp: new Date().toISOString()
    });
    
    saveMockCredits(credits);
    
    return {
      callId,
      status: 'completed',
      duration: call.durationSeconds,
      cost: callCost
    };
  },
  
  // Get call status
  async getCallStatus(callId) {
    await delay();
    
    const calls = getMockCallHistory();
    const call = calls.find(c => c.id === callId);
    
    if (!call) {
      throw new Error('Call not found');
    }
    
    return {
      callId,
      status: call.status,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.durationSeconds || 0
    };
  }
};

// API for credit operations
export const creditApi = {
  // Get current credit balance
  async getBalance() {
    await delay();
    
    const credits = getMockCredits();
    
    return {
      balance: credits.balance
    };
  },
  
  // Add credits
  async addCredits(amount) {
    await delay();
    
    if (amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    const credits = getMockCredits();
    
    credits.balance += amount;
    credits.transactions.unshift({
      id: generateUUID(),
      type: 'credit',
      amount,
      description: 'Added credits',
      timestamp: new Date().toISOString()
    });
    
    saveMockCredits(credits);
    
    return {
      balance: credits.balance,
      addedAmount: amount
    };
  },
  
  // Get transaction history
  async getTransactions(page = 1, limit = 20) {
    await delay();
    
    const credits = getMockCredits();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = credits.transactions.slice(startIndex, endIndex);
    
    return {
      transactions: paginatedTransactions,
      page,
      totalPages: Math.ceil(credits.transactions.length / limit),
      total: credits.transactions.length
    };
  }
};

// API for user operations
export const userApi = {
  // Login
  async login(email, password) {
    await delay();
    
    // Mock login - accept any credentials in development
    const user = getMockUser();
    user.isAuthenticated = true;
    user.email = email || user.email;
    saveMockUser(user);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  },
  
  // Logout
  async logout() {
    await delay();
    
    const user = getMockUser();
    user.isAuthenticated = false;
    saveMockUser(user);
    
    return { success: true };
  },
  
  // Check auth status
  async checkAuth() {
    await delay();
    
    const user = getMockUser();
    
    return {
      isAuthenticated: user.isAuthenticated,
      user: user.isAuthenticated ? {
        id: user.id,
        email: user.email,
        name: user.name
      } : null
    };
  }
};

// For backward compatibility with imports that use default
export default {
  ...callApi,
  ...creditApi,
  ...historyApi,
  ...userApi
};