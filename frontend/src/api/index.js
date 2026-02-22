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
  getMe: () => api.get('/users/me'),
}

export const adminAPI = {
  createClient: (data) => api.post('/admin/clients', data),
  createDriver: (data) => api.post('/admin/drivers', data),
  getClients: () => api.get('/admin/clients'),
  getDrivers: () => api.get('/admin/drivers'),
}

export const orderAPI = {
  submitOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: () => api.get('/orders'),
}

export const driverAPI = {
  getMyManifest: () => api.get('/driver/manifest'),
  markDelivered: (packageId, data) => api.post(`/driver/packages/${packageId}/delivered`, data),
  markFailed: (packageId, data) => api.post(`/driver/packages/${packageId}/failed`, data),
}

export default api