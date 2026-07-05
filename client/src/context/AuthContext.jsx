import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calmer_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('calmer_token')
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => { setUser(data.user); localStorage.setItem('calmer_user', JSON.stringify(data.user)); connectSocket() })
        .catch(() => { localStorage.removeItem('calmer_token'); localStorage.removeItem('calmer_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  function persist(token, u) {
    localStorage.setItem('calmer_token', token)
    localStorage.setItem('calmer_user', JSON.stringify(u))
    setUser(u)
    connectSocket()
  }

  async function login(username, passkey) {
    const { data } = await api.post('/auth/login', { username, passkey })
    persist(data.token, data.user)
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    persist(data.token, data.user)
    return data // includes one-time passkey
  }

  function logout() {
    localStorage.removeItem('calmer_token')
    localStorage.removeItem('calmer_user')
    setUser(null)
    disconnectSocket()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
