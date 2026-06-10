import api from '@/services/api'

export const expenseApi = {
  getDashboard: (params) => api.get('/expenses/dashboard', { params }),
  listEntries: (params) => api.get('/expenses/entries', { params }),
  createEntry: (data) => api.post('/expenses/entries', data),
  getReconciliation: (params) => api.get('/expenses/reconciliation', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  getRecipients: (params) => api.get('/expenses/recipients', { params }),
  createRecipient: (data) => api.post('/expenses/recipients', data),
  updateRecipient: (id, data) => api.patch(`/expenses/recipients/${id}`, data),
}
