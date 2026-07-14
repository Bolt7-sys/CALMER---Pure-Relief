import axios from 'axios'

// In production, VITE_API_URL points at the deployed backend (e.g. https://calmer-api.onrender.com).
// In dev it's empty, so Vite's proxy forwards /api → http://localhost:5000.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const api = axios.create({ baseURL: `${API_BASE}/api`, timeout: 15000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('calmer_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token invalid/expired: clear storage AND tell the app so React state
      // doesn't stay "logged in" with a dead token (auth desync bug).
      if (localStorage.getItem('calmer_token')) {
        localStorage.removeItem('calmer_token')
        localStorage.removeItem('calmer_user')
        window.dispatchEvent(new CustomEvent('calmer:unauthorized'))
      }
    }
    return Promise.reject(err)
  }
)

export default api
