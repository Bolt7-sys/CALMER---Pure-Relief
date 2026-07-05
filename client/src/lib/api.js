import axios from 'axios'

// In production, VITE_API_URL points at the deployed backend (e.g. https://calmer-api.onrender.com).
// In dev it's empty, so Vite's proxy forwards /api → http://localhost:5000.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const api = axios.create({ baseURL: `${API_BASE}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('calmer_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // token invalid; clear only if we had one
      if (localStorage.getItem('calmer_token')) {
        localStorage.removeItem('calmer_token')
        localStorage.removeItem('calmer_user')
      }
    }
    return Promise.reject(err)
  }
)

export default api
