import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('skm_refresh')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          const newToken = data.data.token
          localStorage.setItem('skm_token', newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          localStorage.removeItem('skm_token')
          localStorage.removeItem('skm_refresh')
          localStorage.removeItem('skm_role')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
}

// ─── Branches ─────────────────────────────────────────────────────────────────
export const branchesApi = {
  list: () => api.get('/branches'),
  getOne: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.patch(`/branches/${id}`, data),
  getKpis: (id) => api.get(`/branches/${id}/kpis`),
  getClasses: (id) => api.get(`/branches/${id}/classes`),
  getStudents: (branchId, classId, filters) =>
    api.get(`/branches/${branchId}/classes/${classId}/students`, { params: filters }),
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getKpis: (params) => api.get('/inventory/kpis', { params }),
  listBooks: (params) => api.get('/inventory/books', { params }),
  getBookKit: (kitId, params) => api.get(`/inventory/books/${kitId}`, { params }),
  updateBookStock: (kitId, data) => api.patch(`/inventory/books/${kitId}/stock`, data),
  listUniformCategories: () => api.get('/inventory/uniforms/categories'),
  listUniforms: (params) => api.get('/inventory/uniforms', { params }),
  updateUniformStock: (sizeId, data) => api.patch(`/inventory/uniforms/${sizeId}/stock`, data),
  listAccessories: () => api.get('/inventory/accessories'),
  getLogs: (params) => api.get('/inventory/logs', { params }),
}

// ─── Stock Transfers ──────────────────────────────────────────────────────────
export const transfersApi = {
  list: (params) => api.get('/transfers', { params }),
  create: (data) => api.post('/transfers', data),
  getOne: (id) => api.get(`/transfers/${id}`),
  updateStatus: (id, status) => api.patch(`/transfers/${id}/status`, { status }),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  create: (data) => api.post('/orders', data),
  getOne: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.patch(`/orders/${id}`, data),
  processPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  getKpis: (params) => api.get('/transactions/kpis', { params }),
  list: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  financeSummary: (params) => api.get('/reports/finance-summary', { params }),
  branchPerformance: (params) => api.get('/reports/branch-performance', { params }),
  salesTrend: (params) => api.get('/reports/sales-trend', { params }),
  superDashboard: () => api.get('/reports/super-dashboard'),
  adminDashboard: (params) => api.get('/reports/admin-dashboard', { params }),
}
