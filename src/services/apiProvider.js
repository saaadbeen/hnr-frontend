const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3
};

class TokenManager {
  static getToken() { return localStorage.getItem('jwt_token'); }
  static setToken(token) { localStorage.setItem('jwt_token', token); }
  static removeToken() { localStorage.removeItem('jwt_token'); }

  static isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

class ApiClient {
  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = TokenManager.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const config = {
      method: 'GET',
      headers,
      credentials: 'include',
      ...options
    };

    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        const response = await fetch(url, { ...config, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            TokenManager.removeToken();
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return response;
      } catch (err) {
        lastError = err;
        if (attempt < this.retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return this.request(url);
  }
  post(endpoint, data = {}) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  put(endpoint, data = {}) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  delete(endpoint)         { return this.request(endpoint, { method: 'DELETE' }); }
}

const apiClient = new ApiClient();

/* ======================================
   Services backend (placeholders Phase 8)
====================================== */

const authService = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response?.token) TokenManager.setToken(response.token);
    return response.user;
  },
  async logout() {
    try { await apiClient.post('/auth/logout'); } finally { TokenManager.removeToken(); }
  },
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    if (response?.token) TokenManager.setToken(response.token);
    return response.token;
  },
  async getCurrentUser() { return apiClient.get('/auth/me'); }
};

const missionService = {
  async list(filters = {}) { return apiClient.get('/missions', filters); },
  async get(id)            { return apiClient.get(`/missions/${id}`); },
  async create(data)       { return apiClient.post('/missions', data); },
  async update(id, data)   { return apiClient.put(`/missions/${id}`, data); },
  async delete(id)         { return apiClient.delete(`/missions/${id}`); },
  async getActions(missionId) { return apiClient.get(`/missions/${missionId}/actions`); }
};

const actionService = {
  async list(filters = {}) { return apiClient.get('/actions', filters); },
  async get(id)            { return apiClient.get(`/actions/${id}`); },
  async create(data)       { return apiClient.post('/actions', data); },
  async update(id, data)   { return apiClient.put(`/actions/${id}`, data); },
  async delete(id)         { return apiClient.delete(`/actions/${id}`); },
  async search(query)      { return apiClient.get('/actions/search', { q: query }); }
};

const userService = {
  async list()             { return apiClient.get('/users'); },
  async get(id)            { return apiClient.get(`/users/${id}`); },
  async create(data)       { return apiClient.post('/users', data); },
  async update(id, data)   { return apiClient.put(`/users/${id}`, data); },
  async delete(id)         { return apiClient.delete(`/users/${id}`); }
};

const pvService = {
  async get(id)            { return apiClient.get(`/pv/${id}`); },
  async update(id, data)   { return apiClient.put(`/pv/${id}`, data); },
  async validate(id)       { return apiClient.post(`/pv/${id}/validate`); },
  async list(filters = {}) { return apiClient.get('/pv', filters); }
};

const statsService = {
  async getOverview()      { return apiClient.get('/stats/overview'); },
  async getMissionStats()  { return apiClient.get('/stats/missions'); },
  async getActionStats()   { return apiClient.get('/stats/actions'); },
  async getRecentChanges() { return apiClient.get('/stats/recent-changes'); }
};



class DataProvider {
  constructor(useMock = true) {
    this.useMock = useMock;
  }

  async login(credentials) {
    if (this.useMock) {
      return mockApiService.login(credentials);
    }
    return authService.login(credentials);
  }
  async logout() {
    if (this.useMock) return mockApiService.logout();
    return authService.logout();
  }

  async getMissions() {
    if (this.useMock) return mockApiService.getMissions();
    return missionService.list();
  }
  async createMission(data) {
    if (this.useMock) return mockApiService.createMission(data);
    return missionService.create(data);
  }
  async getMissionById(id) {
    if (this.useMock) return mockApiService.getMissionById(id);
    return missionService.get(id);
  }

  async getActions() {
    if (this.useMock) return mockApiService.getActions();
    return actionService.list();
  }
  async createAction(data) {
    if (this.useMock) return mockApiService.createAction(data);
    return actionService.create(data);
  }
  async searchActions(filters) {
    if (this.useMock) return mockApiService.searchActions(filters);
    return actionService.search(filters?.search || '');
  }

  async listUsers() {
    if (this.useMock) return mockApiService.listUsers();
    return userService.list();
  }
  async createUser(data) {
    if (this.useMock) return mockApiService.createUser(data);
    return userService.create(data);
  }
  async updateUser(id, data) {
    if (this.useMock) return mockApiService.updateUser(id, data);
    return userService.update(id, data);
  }

  async getDouars()        { return this.useMock ? mockApiService.getDouars() : apiClient.get('/douars'); }
  async createDouar(data)  { return this.useMock ? mockApiService.createDouar(data) : apiClient.post('/douars', data); }

  async getChangements() {
    if (this.useMock) return mockApiService.getChangements();
    return statsService.getRecentChanges();
  }

  // PV
  async getPVById(id) {
    if (this.useMock) return mockApiService.getPVById(id);
    return pvService.get(id);
  }
  async updatePV(id, data) {
    if (this.useMock) return mockApiService.updatePV(id, data);
    return pvService.update(id, data);
  }
  async validatePV(id, userId) {
    if (this.useMock) return mockApiService.validatePV(id, userId);
    return pvService.validate(id);
  }

  // Stats
  async getStats() {
    if (this.useMock) return mockApiService.getStats();
    return statsService.getOverview();
  }
}

const USE_MOCK = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;
const dataProvider = new DataProvider(USE_MOCK);

/* Exports */
export {
  authService,
  missionService,
  actionService,
  userService,
  pvService,
  statsService,
  TokenManager,
  ApiClient
};

export default dataProvider;
