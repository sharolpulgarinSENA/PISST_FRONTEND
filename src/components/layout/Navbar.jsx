import { useState } from 'react'
import { Search, Moon, Sun, Bell, ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ darkMode, setDarkMode, onHamburgerClick, onMenuClick }) {
  const [dropdown, setDropdown] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div
      className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 border-b gap-2 sm:gap-3"
      style={{
        backgroundColor: darkMode ? '#0B0F19' : '#FFFFFF',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB'
      }}
    >
      {/* ============ IZQUIERDA: hamburguesa + búsqueda ============ */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Botón hamburguesa — solo móvil */}
        <button
          onClick={onMenuClick}
          className="lg:hidden mr-3"
          style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 🔍 BÚSQUEDA — Versión MOBILE: solo icono que despliega input */}
        <div className="md:hidden relative">
          <button
            onClick={() => setMobileSearchOpen(v => !v)}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{
              backgroundColor: darkMode ? '#111827' : '#F3F4F6',
              color: '#9CA3AF'
            }}
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>

          {mobileSearchOpen && (
            <div
              className="absolute left-0 top-12 z-50 rounded-lg shadow-xl p-2 flex items-center gap-2"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
                width: 'calc(100vw - 24px)',
                maxWidth: '320px'
              }}
            >
              <Search size={15} style={{ color: '#9CA3AF' }} />
              <input
                type="text"
                autoFocus
                placeholder="Buscar en PISST..."
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
                style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
              />
              <button onClick={() => setMobileSearchOpen(false)}>
                <X size={16} style={{ color: '#9CA3AF' }} />
              </button>
            </div>
          )}
        </div>

        {/* 🔍 BÚSQUEDA — Versión DESKTOP/TABLET: barra completa */}
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            backgroundColor: darkMode ? '#111827' : '#F3F4F6',
            width: '320px'
          }}
        >
          <Search size={15} style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Buscar en PISST..."
            className="bg-transparent text-sm outline-none w-full min-w-0"
            style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
          />
          <span
            className="text-xs px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: darkMode ? '#1F2937' : '#E5E7EB',
              color: '#9CA3AF'
            }}
          >
            Ctrl+K
          </span>
        </div>
      </div>

      {/* ============ CENTRO: Acciones rápidas (solo desktop) ============ */}
      <div className="hidden md:flex items-center gap-2">
        {[
          { label: 'Nuevo reporte',        path: '/incidentes?nuevo=true' },
          { label: 'Capacitaciones',       path: '/capacitaciones' },
          { label: 'Evaluación de Riesgos',path: '/riesgos' },
          { label: 'Auditorías',           path: '/auditorias' },
        ].map(({ label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80"
            style={{
              backgroundColor: darkMode ? '#1A1F33' : '#F3F4F6',
              color: darkMode ? '#E5E7EB' : '#374151',
              border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ============ DERECHA: toggle + notificaciones + usuario ============ */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">

        {/* Toggle dark/light completo — desde sm */}
        <div
          className="hidden sm:flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: darkMode ? '#111827' : '#F3F4F6' }}
        >
          <button
            onClick={() => setDarkMode(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition"
            style={{
              backgroundColor: darkMode ? '#1F2937' : 'transparent',
              color: darkMode ? '#E5E7EB' : '#9CA3AF'
            }}
          >
            <Moon size={13} /> Dark
          </button>
          <button
            onClick={() => setDarkMode(false)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition"
            style={{
              backgroundColor: !darkMode ? '#E5E7EB' : 'transparent',
              color: !darkMode ? '#111827' : '#9CA3AF'
            }}
          >
            <Sun size={13} /> Light
          </button>
        </div>

        {/* Toggle compacto en mobile pequeño */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="sm:hidden p-2 rounded-lg"
          style={{
            backgroundColor: darkMode ? '#111827' : '#F3F4F6',
            color: darkMode ? '#E5E7EB' : '#374151'
          }}
          aria-label="Cambiar tema"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notificaciones — siempre visible */}
        <button className="relative p-1" style={{ color: '#9CA3AF' }}>
          <Bell size={18} />
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
            style={{ backgroundColor: '#6366F1' }}
          >
            3
          </span>
        </button>

        {/* 👤 USUARIO — SOLO en desktop completo (lg+) */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setDropdown(v => !v)}
            className="flex items-center gap-2"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: '#6366F1' }}
            >
              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: darkMode ? '#E5E7EB' : '#111827' }}>
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs capitalize" style={{ color: '#9CA3AF' }}>
                {user?.role || ''}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
          </button>

          {dropdown && (
            <div
              className="absolute right-0 top-12 w-44 rounded-xl shadow-xl z-50 overflow-hidden"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`
              }}
            >
              {[
                { icon: User, label: 'Perfil' },
                { icon: Settings, label: 'Configuración' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition hover:opacity-80"
                  style={{ color: darkMode ? '#E5E7EB' : '#374151' }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
              <div
                className="border-t"
                style={{ borderColor: darkMode ? '#1F2937' : '#E5E7EB' }}
              />
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm"
                style={{ color: '#EF4444' }}
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}