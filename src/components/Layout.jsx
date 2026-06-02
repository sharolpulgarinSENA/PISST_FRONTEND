import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import Navbar from './layout/Navbar'
import MobileBottomNav from './layout/MobileBottomNav'
import { useTheme } from '../context/ThemeContext'

const routeToNav = {
  '/dashboard':      'dashboard',
  '/incidentes':     'reportes',
  '/riesgos':        'evaluacion',
  '/capacitaciones': 'capacitaciones',
  '/auditorias':     'auditorias',
}

const navToRoute = {
  dashboard:      '/dashboard',
  reportes:       '/incidentes',
  evaluacion:     '/riesgos',
  capacitaciones: '/capacitaciones',
  auditorias:     '/auditorias',
  mas:            '/usuarios',
}

export default function Layout() {
  // El tema ahora viene del contexto global (persistido y sincronizado con el Login)
  const { darkMode, setDarkMode } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const activeNav = routeToNav[location.pathname] || 'dashboard'

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
          {/* Se mantiene el outlet context para que las páginas existentes
              (Capacitaciones, etc.) sigan usando useOutletContext sin cambios */}
          <Outlet context={{ darkMode }} />
        </main>
      </div>

      <MobileBottomNav
        darkMode={darkMode}
        active={activeNav}
        onChange={handleNavChange}
      />
    </div>
  )
}