/**
 * Mock call history data for development and testing
 * This data is used when the real API is not available or returns no data
 */

// Helper to generate a random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate mock call history
export const generateMockCalls = () => {
  const now = new Date();
  
  return [
    {
      id: generateUUID(),
      phone_number: "+44 7700 900123",
      country_code: "GB",
      status: "completed",
      duration: 125,
      start_time: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      end_time: new Date(now.getTime() - 1000 * 60 * 28).toISOString(),   // 28 minutes ago
      created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString()
    },
    {
      id: generateUUID(),
      phone_number: "+1 212 555 1234",
      country_code: "US",
      status: "completed",
      duration: 304,
      start_time: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      end_time: new Date(now.getTime() - 1000 * 60 * 115).toISOString(),   // 1 hour 55 minutes ago
      created_at: new Date(now.getTime() - 1000 * 60 * 120).toISOString()
    },
    {
      id: generateUUID(),
      phone_number: "+33 1 23 45 67 89",
      country_code: "FR",
      status: "completed",
      duration: 75,
      start_time: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      end_time: new Date(now.getTime() - 1000 * 60 * 60 * 3 + 1000 * 75).toISOString(),
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString()
    },
    {
      id: generateUUID(),
      phone_number: "+49 30 1234567",
      country_code: "DE",
      status: "completed",
      duration: 45,
      start_time: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      end_time: new Date(now.getTime() - 1000 * 60 * 60 * 24 + 1000 * 45).toISOString(),
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: generateUUID(),
      phone_number: "+1 415 555 2671",
      country_code: "US",
      status: "completed",
      duration: 520,
      start_time: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      end_time: new Date(now.getTime() - 1000 * 60 * 60 * 48 + 1000 * 520).toISOString(),
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString()
    }
  ];
};

// Default mock calls
export const mockCalls = generateMockCalls(); 