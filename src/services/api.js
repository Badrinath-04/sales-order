import axios from 'axios'

function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()
  if (fromEnv) {
    const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(fromEnv)
    // Guard production builds from accidentally using local API URLs.
    if (import.meta.env.PROD && pointsToLocalhost) return '/_/backend/api'
    return fromEnv
  }
  if (import.meta.env.DEV) return 'http://localhost:4000/api'
  // Vercel multi-service backend routePrefix
  return '/_/backend/api'
}

const BASE_URL = resolveApiBaseUrl()

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
  bulkCreateStudents: (branchId, data) => api.post(`/branches/${branchId}/students/bulk`, data),
  createStudent: (branchId, data) => api.post(`/branches/${branchId}/students`, data),
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getKpis: (params) => api.get('/inventory/kpis', { params }),
  listBooks: (params) => api.get('/inventory/books', { params }),
  getBookKit: (kitId, params) => api.get(`/inventory/books/${kitId}`, { params }),
  updateBookStock: (kitId, data) => api.patch(`/inventory/books/${kitId}/stock`, data),
  bulkAdjustBookStock: (data) => api.post('/inventory/books/bulk-adjust', data),
  createProduct: (data) => api.post('/inventory/products', data),
  updateProduct: (itemId, data) => api.patch(`/inventory/products/${itemId}`, data),
  archiveProduct: (itemId) => api.delete(`/inventory/products/${itemId}`),
  restoreProduct: (itemId) => api.patch(`/inventory/products/${itemId}/restore`),
  listUniformCategories: () => api.get('/inventory/uniforms/categories'),
  listUniforms: (params) => api.get('/inventory/uniforms', { params }),
  createUniformProduct: (data) => api.post('/inventory/uniforms/products', data),
  updateUniformProduct: (categoryId, data) => api.patch(`/inventory/uniforms/products/${categoryId}`, data),
  bulkAdjustUniformStock: (data) => api.post('/inventory/uniforms/bulk-adjust', data),
  updateUniformStock: (sizeId, data) => api.patch(`/inventory/uniforms/${sizeId}/stock`, data),
  listAccessories: (params) => api.get('/inventory/accessories', { params }),
  updateAccessoryStock: (accessoryId, data) => api.patch(`/inventory/accessories/${accessoryId}/stock`, data),
  getLogs: (params) => api.get('/inventory/logs', { params }),
}

// ─── Publishers / Accounts ────────────────────────────────────────────────────
export const publishersApi = {
  dashboard: () => api.get('/publishers/dashboard'),
  list: () => api.get('/publishers'),
  getOne: (id) => api.get(`/publishers/${id}`),
  create: (data) => api.post('/publishers', data),
  update: (id, data) => api.patch(`/publishers/${id}`, data),
  listProcurements: (params) => api.get('/publishers/procurements/list', { params }),
  createProcurement: (data) => api.post('/publishers/procurements', data),
  addPayment: (publisherId, data) => api.post(`/publishers/${publisherId}/payments`, data),
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
  getDues: (params) => api.get('/transactions/dues', { params }),
  getOne: (id) => {
    const normalized = decodeURIComponent(String(id ?? ''))
    return api.get(`/transactions/${encodeURIComponent(normalized)}`)
  },
}

// ─── Admin Management ─────────────────────────────────────────────────────────
export const adminMgmtApi = {
  list: () => api.get('/admins'),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.patch(`/admins/${id}`, data),
  resetPassword: (id, password) => api.post(`/admins/${id}/reset-password`, { password }),
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  financeSummary: (params) => api.get('/reports/finance-summary', { params }),
  branchPerformance: (params) => api.get('/reports/branch-performance', { params }),
  salesTrend: (params) => api.get('/reports/sales-trend', { params }),
  superDashboard: () => api.get('/reports/super-dashboard'),
  adminDashboard: (params) => api.get('/reports/admin-dashboard', { params }),
}
