import api from '@/services/api'

export const expenseApi = {
  getDashboard: (params) => api.get('/expenses/dashboard', { params }),
  listEntries: (params) => api.get('/expenses/entries', { params }),
  createEntry: (data) => api.post('/expenses/entries', data),
  updateEntryStatus: (id, status) => api.patch(`/expenses/entries/${id}/status`, { status }),
  getDailyPosition: (params) => api.get('/expenses/daily', { params }),
  getReconciliation: (params) => api.get('/expenses/reconciliation', { params }),
  getOnlineSummary: (params) => api.get('/expenses/online-summary', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  getRecipients: (params) => api.get('/expenses/recipients', { params }),
  createRecipient: (data) => api.post('/expenses/recipients', data),
  updateRecipient: (id, data) => api.patch(`/expenses/recipients/${id}`, data),
  listSettlements: (params) => api.get('/expenses/settlements', { params }),
  createSettlement: (data) => api.post('/expenses/settlements', data),
}
