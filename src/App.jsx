import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import MobileBottomNav from './components/layout/MobileBottomNav'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <BrowserRouter>
      <div
        className="h-screen overflow-hidden"
        style={{ backgroundColor: darkMode ? '#0B0F19' : '#F9FAFB' }}
      >
        {/* ============ OVERLAY DEL DRAWER (solo mobile) ============ */}
        {mobileDrawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        <div className="flex h-full">
          {/* ============ SIDEBAR ============
              - Mobile (<lg): drawer flotante con translate-x
              - Desktop (>=lg): visible permanente en flujo normal
          */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-50
              transition-transform duration-300 ease-in-out
              ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0
            `}
          >
            <Sidebar
              darkMode={darkMode}
              isMobileOpen={mobileDrawerOpen}
              onMobileClose={() => setMobileDrawerOpen(false)}
            />
          </aside>

          {/* ============ COLUMNA PRINCIPAL ============ */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Navbar
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onHamburgerClick={() => setMobileDrawerOpen(true)}
            />

            {/* El Dashboard ya maneja su propio scroll y padding interno */}
            <Dashboard darkMode={darkMode} />
          </div>
        </div>

        {/* ============ BOTTOM NAV (solo mobile) ============ */}
        <MobileBottomNav
          darkMode={darkMode}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </BrowserRouter>
  )
}