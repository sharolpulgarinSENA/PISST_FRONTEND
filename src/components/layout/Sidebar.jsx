import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, ShieldAlert,
  BookOpen, ClipboardList, Users,
  ChevronLeft, ChevronRight, X, LogOut
} from 'lucide-react'
import logoOscuro from '../../assets/imagenes/pisst_logo.png'
import logoClaro from '../../assets/imagenes/logopisstCLaro-removebg-preview.png'
import logoMini from '../../assets/imagenes/sincasco-removebg-preview.png'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const navItemsSST = [
  { icon: LayoutDashboard, label: 'Dashboard',             path: '/dashboard' },
  { icon: AlertTriangle,   label: 'Reportes',              path: '/incidentes' },
  { icon: ShieldAlert,     label: 'Evaluación de Riesgos', path: '/riesgos' },
  { icon: BookOpen,        label: 'Capacitaciones',        path: '/capacitaciones' },
  { icon: ClipboardList,   label: 'Auditorías',            path: '/auditorias' },
  { icon: Users,           label: 'Usuarios',              path: '/usuarios' },
]

const navItemsGerencia = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard'  },
  { icon: AlertTriangle,   label: 'Mis reportes', path: '/incidentes' },
]

export default function Sidebar({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const { darkMode } = useTheme()

  const navItems = user?.role?.toString?.().toLowerCase?.() === 'gerencia'
    ? navItemsGerencia
    : navItemsSST

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  // Paleta theme-aware
  const bg       = darkMode ? '#0B0F19' : '#FFFFFF'
  const border   = darkMode ? '#1F2937' : '#E5E7EB'
  const cardBg   = darkMode ? '#111827' : '#F3F4F6'
  const sub      = darkMode ? '#CBD5E1' : '#6B7280'
  const text     = darkMode ? '#FFFFFF' : '#111827'
  const logo     = darkMode ? logoOscuro : logoClaro

  const sidebarContent = (
    <div
      className="flex flex-col justify-between h-full transition-all duration-300 border-r"
      style={{
        width: collapsed ? '72px' : '220px',
        backgroundColor: bg,
        borderColor: border
      }}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center justify-between py-4 px-3 border-b" style={{ borderColor: border }}>
        {!collapsed
          ? <img src={logo} alt="PISST" style={{ height: '56px', width: 'auto', maxWidth: '100%' }} />
          : <img src={logoMini} alt="PISST" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
        }
          {/* Botón X solo en móvil */}
          {onClose && (
            <button onClick={onClose} className="lg:hidden ml-2" style={{ color: sub }} aria-label="Cerrar menú">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className="mt-4 flex flex-col gap-1 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                title={collapsed ? label : undefined}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left"
                style={{
                  backgroundColor: active ? (darkMode ? '#1A1F33' : '#EEF2FF') : 'transparent',
                  color: active ? '#6366F1' : sub,
                }}
              >
                <Icon size={18} />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Perfil y colapsar */}
      <div>
              {!collapsed && (
        <div className="mx-2 mb-3 p-3 rounded-xl" style={{ backgroundColor: cardBg }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: '#6366F1' }}>
              {user?.foto_url
                ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" />
                : (user?.nombre?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div>
              <p className="text-sm font-semibold truncate max-w-[120px]" style={{ color: text }}>
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs capitalize" style={{ color: sub }}>
                {user?.role || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs" style={{ color: sub }}>En línea</span>
          </div>
        </div>
      )}

        {/* Botón colapsar — solo desktop */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden lg:flex items-center gap-2 w-full px-4 py-3 border-t text-sm transition"
          style={{ color: sub, borderColor: border }}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span>Colapsar menú</span></>
          }
        </button>
      </div>
    </div>
  )

 return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden lg:flex h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* ── Móvil: overlay fullscreen ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Fondo oscuro clickeable */}
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          {/* Sidebar completo — siempre expandido en móvil */}
          <div className="relative z-10 h-full flex flex-col border-r"
               style={{ width: '280px', backgroundColor: bg, borderColor: border }}>

            {/* Logo + X */}
            <div className="flex items-center justify-between py-4 px-4 border-b" style={{ borderColor: border }}>
              <img src={logo} alt="PISST" style={{ height: '48px', width: 'auto' }} />
              <button onClick={onClose} style={{ color: sub }} aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 mt-4 flex flex-col gap-1 px-2 overflow-y-auto">
              {navItems.map(({ icon: Icon, label, path }) => {
                const active = location.pathname === path
                return (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left"
                    style={{
                      backgroundColor: active ? (darkMode ? '#1A1F33' : '#EEF2FF') : 'transparent',
                      color: active ? '#6366F1' : sub,
                    }}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Perfil + cerrar sesión */}
            <div className="p-4 border-t" style={{ borderColor: border }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
                     style={{ backgroundColor: '#6366F1' }}>
                  {user?.foto_url
                    ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" />
                    : (user?.nombre?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: text }}>{user?.nombre || 'Usuario'}</p>
                  <p className="text-xs capitalize" style={{ color: sub }}>{user?.role || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-xs" style={{ color: sub }}>En línea</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition"
                style={{ color: '#EF4444', backgroundColor: '#2A1010' }}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}