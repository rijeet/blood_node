// API client with automatic token refresh

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '';
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        return result.access_token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  }

  private async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem('access_token');
    
    if (!token || token === 'undefined' || token === 'null') {
      // Clean up invalid tokens
      if (token === 'undefined' || token === 'null') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      return null;
    }

    try {
      // Check if token is expired by trying to decode it
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp > now) {
        return token; // Token is still valid
      }
    } catch (error) {
      // Token is malformed, try to refresh
    }

    // Token is expired or invalid, try to refresh
    const refreshedToken = await this.refreshToken();
    return refreshedToken;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getValidToken();
    // Debug logging removed to prevent console spam
    
    if (!token) {
      console.log('API Client - No valid token, redirecting to login');
      // Redirect to login or handle authentication error
      window.location.href = '/?login=true';
      throw new Error('Authentication required');
    }

    // Debug logging removed to prevent console spam
    
    // Ensure token is a valid string before using it
    if (typeof token !== 'string' || token === 'undefined' || token === 'null') {
      console.error('API Client - Invalid token type or value:', token);
      window.location.href = '/?login=true';
      throw new Error('Invalid token');
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        // Token might be invalid, try to refresh once more
        const newToken = await this.refreshToken();
        if (newToken) {
          console.log('✅ Token refreshed, retrying request...');
          // Retry the request with the new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, retryConfig);
          
          if (retryResponse.status === 401) {
            console.log('❌ Still getting 401 after token refresh, redirecting to login');
            window.location.href = '/?login=true';
            throw new Error('Authentication failed after token refresh');
          }
          
          if (!retryResponse.ok) {
            throw new Error(`Request failed: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        } else {
          console.log('❌ Token refresh failed, redirecting to login');
          // Refresh failed, redirect to login
          window.location.href = '/?login=true';
          throw new Error('Authentication failed');
        }
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
