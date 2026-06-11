/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext(null)

function leerSesion() {
  try {
    const token = sessionStorage.getItem('pisst_token')
    const userStr = sessionStorage.getItem('pisst_user')
    const user = userStr ? JSON.parse(userStr) : null
    console.log('[AuthContext] Sesión leída:', { token: !!token, user })
    return { token, user }
  } catch (error) {
    console.error('[AuthContext] Error al leer sesión:', error)
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Lee la sesión UNA SOLA VEZ al montar
  useEffect(() => {
    try {
      const { token: savedToken, user: savedUser } = leerSesion()
      setToken(savedToken)
      setUser(savedUser)
    } catch (error) {
      console.error('[AuthContext] Error inicializando:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function login(accessToken, userData) {
    sessionStorage.setItem('pisst_token', accessToken)
    sessionStorage.setItem('pisst_user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }

  function logout() {
    sessionStorage.removeItem('pisst_token')
    sessionStorage.removeItem('pisst_user')
    setToken(null)
    setUser(null)
  }

  if (isLoading) {
    return <div style={{ backgroundColor: '#0B0F19', minHeight: '100vh' }} />
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}