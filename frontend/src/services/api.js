import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }
        
        const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken })
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 403) {
      // Dashboard routes fail silently – they fall back to mock data in the hooks
      const url = error.config?.url || ''
      if (!url.includes('/api/dashboard')) {
        toast.error('Access denied')
      }
    }

    if (error.response?.status === 404) {
      toast.error('Resource not found')
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    return Promise.reject(error)
  }
)

export default api