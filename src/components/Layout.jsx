import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import Navbar from './layout/Navbar'
import MobileBottomNav from './layout/MobileBottomNav'
import SasbotWidget from './chat/SasbotWidget'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ErrorBoundary from './ErrorBoundary'
import { ROLES } from '../constants/roles'

const routeToNavSST = {
  '/dashboard':      'dashboard',
  '/incidentes':     'reportes',
  '/riesgos':        'evaluacion',
  '/capacitaciones': 'capacitaciones',
  '/auditorias':     'auditorias',
  '/usuarios':       'mas',
}

const navToRouteSST = {
  dashboard:      '/dashboard',
  reportes:       '/incidentes',
  evaluacion:     '/riesgos',
  capacitaciones: '/capacitaciones',
  auditorias:     '/auditorias',
  mas:            '/usuarios',
}

const routeToNavGerencia = {
  '/dashboard':  'dashboard',
  '/incidentes': 'reportes',
  '/perfil':     'perfil',
}

const navToRouteGerencia = {
  dashboard: '/dashboard',
  reportes:  '/incidentes',
  perfil:    '/perfil',
}

export default function Layout() {
  // El tema ahora viene del contexto global (persistido y sincronizado con el Login)
  const { darkMode, setDarkMode } = useTheme()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const esGerencia = user?.role?.toString?.().toLowerCase?.() === ROLES.GERENCIA
  const routeToNav = esGerencia ? routeToNavGerencia : routeToNavSST
  const navToRoute = esGerencia ? navToRouteGerencia : navToRouteSST

  const activeNav = routeToNav[location.pathname] || 'dashboard'

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 })
  }, [location.pathname])

  const handleNavChange = (id) => {
    const path = navToRoute[id]
    if (path) navigate(path)
  }

  return (
    <div className="flex h-screen overflow-hidden"
         style={{ backgroundColor: darkMode ? '#0B0F19' : '#F9FAFB' }}>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <MobileBottomNav
        darkMode={darkMode}
        active={activeNav}
        onChange={handleNavChange}
        role={user?.role}
      />

      <SasbotWidget darkMode={darkMode} />
    </div>
  )
}