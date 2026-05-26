import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, ShieldAlert,
  BookOpen, ClipboardList, Users, Settings,
  ChevronLeft, ChevronRight, X, LogOut
} from 'lucide-react'
import logo from '../../assets/imagenes/pisst_logo.png'
import logoMini from '../../assets/imagenes/sincasco-removebg-preview.png'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',             path: '/dashboard' },
  { icon: AlertTriangle,   label: 'Reportes',              path: '/incidentes' },
  { icon: ShieldAlert,     label: 'Evaluación de Riesgos', path: '/riesgos' },
  { icon: BookOpen,        label: 'Capacitaciones',        path: '/capacitaciones' },
  { icon: ClipboardList,   label: 'Auditorías',            path: '/auditorias' },
  { icon: Users,           label: 'Usuarios',              path: '/usuarios' },
  { icon: Settings,        label: 'Configuración',         path: '/configuracion' },
]

export default function Sidebar({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  const sidebarContent = (
    <div
      className="flex flex-col justify-between h-full transition-all duration-300 border-r"
      style={{
        width: collapsed ? '72px' : '220px',
        backgroundColor: '#0B0F19',
        borderColor: '#1F2937'
      }}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center justify-between py-4 px-3 border-b" style={{ borderColor: '#1F2937' }}>
        {!collapsed
          ? <img src={logo} alt="PISST" style={{ height: '56px', width: 'auto', maxWidth: '100%' }} />
          : <img src={logoMini} alt="PISST" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
        }
          {/* Botón X solo en móvil */}
          {onClose && (
            <button onClick={onClose} className="lg:hidden ml-2" style={{ color: '#9CA3AF' }}>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left"
                style={{
                  backgroundColor: active ? '#1A1F33' : 'transparent',
                  color: active ? '#6366F1' : '#9CA3AF',
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
        <div className="mx-2 mb-3 p-3 rounded-xl" style={{ backgroundColor: '#111827' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: '#6366F1' }}>
              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate max-w-[120px]">
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs capitalize" style={{ color: '#9CA3AF' }}>
                {user?.role || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>En línea</span>
          </div>
        </div>
      )}

        {/* Botón colapsar — solo desktop */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden lg:flex items-center gap-2 w-full px-4 py-3 border-t text-sm transition"
          style={{ color: '#9CA3AF', borderColor: '#1F2937' }}
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
               style={{ width: '280px', backgroundColor: '#0B0F19', borderColor: '#1F2937' }}>

            {/* Logo + X */}
            <div className="flex items-center justify-between py-4 px-4 border-b" style={{ borderColor: '#1F2937' }}>
              <img src={logo} alt="PISST" style={{ height: '48px', width: 'auto' }} />
              <button onClick={onClose} style={{ color: '#9CA3AF' }}>
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
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left"
                    style={{
                      backgroundColor: active ? '#1A1F33' : 'transparent',
                      color: active ? '#6366F1' : '#9CA3AF',
                    }}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Perfil + cerrar sesión */}
            <div className="p-4 border-t" style={{ borderColor: '#1F2937' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                     style={{ backgroundColor: '#6366F1' }}>
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{user?.nombre || 'Usuario'}</p>
                  <p className="text-xs capitalize" style={{ color: '#9CA3AF' }}>{user?.role || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>En línea</span>
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