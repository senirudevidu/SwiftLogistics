import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  getMe: () => api.get('/me'),
}

export const adminAPI = {
  createClient: (data) => api.post('/admin/clients', data),
  createDriver: (data) => api.post('/admin/drivers', data),
  getClients:   ()     => api.get('/admin/clients'),
  getDrivers:   ()     => api.get('/admin/drivers'),
  deleteClient: (id)   => api.delete(`/admin/clients/${id}`),
  deleteDriver: (id)   => api.delete(`/admin/drivers/${id}`),
  updateClient: (id, data) => api.patch(`/admin/clients/${id}`, data),
  updateDriver: (id, data) => api.patch(`/admin/drivers/${id}`, data),
  // No safe404 wrapper — callers check err.response.status to distinguish
  // "endpoint not yet implemented (404)" from "genuinely no data".
  getOrders: () => api.get('/orders'),
}

// Silently swallow 404s for GET endpoints that don't exist yet in the gateway.
// Returns an empty-data response so callers treat it as "no data" rather than an error.
const safe404 = (emptyVal = []) => (err) => {
  if (err?.response?.status === 404) return { data: emptyVal }
  return Promise.reject(err)
}

export const orderAPI = {
  submitOrder:  (data) => api.post('/order', data),                                           // gateway: POST /order
  getMyOrders:  ()     => api.get('/orders/my').catch(safe404([])),
  getOrderById: (id)   => api.get(`/orders/${id}`).catch(safe404(null)),
  getAllOrders:  ()     => api.get('/orders').catch(safe404([])),
}

export const clientAPI = {
  getProfile:  ()     => api.get('/me'),
  createOrder: (data) => api.post('/order', data),
  getMyOrders: ()     => api.get('/orders/my').catch(safe404([])),
}

export const driverAPI = {
  getMyJobs:     ()              => api.get('/orders').catch(safe404([])),
  getJobById:    (id)            => api.get(`/orders/${id}`).catch(safe404(null)),
  getProfile:    ()              => api.get('/me'),
  markDelivered: (jobId, data)   => api.post(`/driver/packages/${jobId}/delivered`, data),
  markFailed:    (jobId, data)   => api.post(`/driver/packages/${jobId}/failed`, data),
}

export default api