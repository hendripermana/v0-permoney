import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Enhanced API client for Astro with Cloudflare optimization
 */
class AstroAPIClient {
  private client: AxiosInstance;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Cached API call with TTL
   */
  async getCached<T = any>(url: string, ttl = 5 * 60 * 1000): Promise<T> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const response = await this.client.get<T>(url);
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl,
      });

      return response.data;
    } catch (error) {
      // Fallback to cache on error
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Server-side API call (for Astro server components)
   */
  async getServer<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Client-side API call with React Query integration
   */
  async getClient<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.client.post('/auth/login', credentials),
    register: (userData: { email: string; password: string; name: string }) =>
      this.client.post('/auth/register', userData),
    logout: () => this.client.post('/auth/logout'),
    me: () => this.client.get('/auth/me'),
  };

  // Households endpoints
  households = {
    list: () => this.getCached('/households'),
    get: (id: string) => this.getCached(`/households/${id}`),
    create: (data: any) => this.client.post('/households', data),
    update: (id: string, data: any) => this.client.put(`/households/${id}`, data),
    delete: (id: string) => this.client.delete(`/households/${id}`),
  };

  // Accounts endpoints
  accounts = {
    list: (householdId: string) => this.getCached(`/households/${householdId}/accounts`),
    get: (id: string) => this.getCached(`/accounts/${id}`),
    create: (householdId: string, data: any) =>
      this.client.post(`/households/${householdId}/accounts`, data),
    update: (id: string, data: any) => this.client.put(`/accounts/${id}`, data),
    delete: (id: string) => this.client.delete(`/accounts/${id}`),
  };

  // Transactions endpoints
  transactions = {
    list: (householdId: string, params?: any) =>
      this.getCached(`/households/${householdId}/transactions`, { params }),
    get: (id: string) => this.getCached(`/transactions/${id}`),
    create: (householdId: string, data: any) =>
      this.client.post(`/households/${householdId}/transactions`, data),
    update: (id: string, data: any) => this.client.put(`/transactions/${id}`, data),
    delete: (id: string) => this.client.delete(`/transactions/${id}`),
  };

  // Categories endpoints
  categories = {
    list: (householdId?: string) =>
      this.getCached('/categories', { params: { householdId } }),
    get: (id: string) => this.getCached(`/categories/${id}`),
    create: (data: any) => this.client.post('/categories', data),
    update: (id: string, data: any) => this.client.put(`/categories/${id}`, data),
    delete: (id: string) => this.client.delete(`/categories/${id}`),
  };

  // Budgets endpoints
  budgets = {
    list: (householdId: string) => this.getCached(`/households/${householdId}/budgets`),
    get: (id: string) => this.getCached(`/budgets/${id}`),
    create: (householdId: string, data: any) =>
      this.client.post(`/households/${householdId}/budgets`, data),
    update: (id: string, data: any) => this.client.put(`/budgets/${id}`, data),
    delete: (id: string) => this.client.delete(`/budgets/${id}`),
  };

  // Analytics endpoints
  analytics = {
    dashboard: (householdId: string) =>
      this.getCached(`/households/${householdId}/analytics/dashboard`, 60 * 1000),
    spending: (householdId: string, params?: any) =>
      this.getCached(`/households/${householdId}/analytics/spending`, { params }),
    income: (householdId: string, params?: any) =>
      this.getCached(`/households/${householdId}/analytics/income`, { params }),
    trends: (householdId: string, params?: any) =>
      this.getCached(`/households/${householdId}/analytics/trends`, { params }),
  };

  // Notifications endpoints
  notifications = {
    list: (params?: any) => this.getCached('/notifications', { params }),
    markAsRead: (id: string) => this.client.put(`/notifications/${id}/read`),
    markAllAsRead: () => this.client.put('/notifications/read-all'),
  };

  // Utility methods
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const api = new AstroAPIClient();

// Export singleton for React components
export default api;
