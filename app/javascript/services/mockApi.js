// This file is only here to prevent loading errors
// It forwards all calls to the real API

import api from './api';

export const callApi = api;
export const creditApi = api;

// Export to avoid console errors
export default api; 