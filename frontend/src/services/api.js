import { API_URL } from '../config';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // When options.headers is explicitly set to {} (FormData), skip Content-Type
    const isFormData = options.body instanceof FormData;
    const headers = isFormData
      ? {} // Let browser set Content-Type with multipart boundary
      : { 'Content-Type': 'application/json', ...options.headers };

    // Attach token if exists
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Intercept 401 Unauthorized globally
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          // Dispatch a custom event so the AuthContext can listen and update state
          window.dispatchEvent(new Event('auth:unauthorized'));
        }

        // Throw error with the backend's error message
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      // Re-throw so caller can handle it
      throw error;
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  patch(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const api = new ApiClient(API_URL);

export default api;
