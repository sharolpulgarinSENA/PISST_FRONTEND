// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sesión al montar
  useEffect(() => {
    const token      = sessionStorage.getItem('pisst_token')
    const userGuardado = sessionStorage.getItem('pisst_user')
    if (token && userGuardado) {
      try { setUser(JSON.parse(userGuardado)) }
      catch { sessionStorage.clear() }
    }
    setLoading(false)
  }, [])

  /**
   * Compatible con tu login.jsx actual:
   * login(access_token, { role, nombre, email })
   */
  const login = (access_token, userData) => {
    sessionStorage.setItem('pisst_token', access_token)
    sessionStorage.setItem('pisst_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    sessionStorage.removeItem('pisst_token')
    sessionStorage.removeItem('pisst_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}