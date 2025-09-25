import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    register: (userData: { email: string; password: string; name: string }) =>
      apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
  },

  // Households
  households: {
    list: () => apiClient.get('/households'),
    get: (id: string) => apiClient.get(`/households/${id}`),
    create: (data: any) => apiClient.post('/households', data),
    update: (id: string, data: any) => apiClient.put(`/households/${id}`, data),
    delete: (id: string) => apiClient.delete(`/households/${id}`),
  },

  // Accounts
  accounts: {
    list: (householdId: string) => apiClient.get(`/households/${householdId}/accounts`),
    get: (id: string) => apiClient.get(`/accounts/${id}`),
    create: (householdId: string, data: any) => 
      apiClient.post(`/households/${householdId}/accounts`, data),
    update: (id: string, data: any) => apiClient.put(`/accounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/accounts/${id}`),
  },

  // Transactions
  transactions: {
    list: (householdId: string, params?: any) => 
      apiClient.get(`/households/${householdId}/transactions`, { params }),
    get: (id: string) => apiClient.get(`/transactions/${id}`),
    create: (householdId: string, data: any) => 
      apiClient.post(`/households/${householdId}/transactions`, data),
    update: (id: string, data: any) => apiClient.put(`/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transactions/${id}`),
  },

  // Categories
  categories: {
    list: (householdId?: string) => 
      apiClient.get('/categories', { params: { householdId } }),
    get: (id: string) => apiClient.get(`/categories/${id}`),
    create: (data: any) => apiClient.post('/categories', data),
    update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
    delete: (id: string) => apiClient.delete(`/categories/${id}`),
  },

  // Budgets
  budgets: {
    list: (householdId: string) => apiClient.get(`/households/${householdId}/budgets`),
    get: (id: string) => apiClient.get(`/budgets/${id}`),
    create: (householdId: string, data: any) => 
      apiClient.post(`/households/${householdId}/budgets`, data),
    update: (id: string, data: any) => apiClient.put(`/budgets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budgets/${id}`),
  },

  // Analytics
  analytics: {
    dashboard: (householdId: string) => 
      apiClient.get(`/households/${householdId}/analytics/dashboard`),
    spending: (householdId: string, params?: any) => 
      apiClient.get(`/households/${householdId}/analytics/spending`, { params }),
    income: (householdId: string, params?: any) => 
      apiClient.get(`/households/${householdId}/analytics/income`, { params }),
    trends: (householdId: string, params?: any) => 
      apiClient.get(`/households/${householdId}/analytics/trends`, { params }),
  },

  // Notifications
  notifications: {
    list: (params?: any) => apiClient.get('/notifications', { params }),
    markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
  },
};

export default apiClient;