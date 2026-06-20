import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { Building2, Users, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import pisstLogo from '../../../assets/imagenes/pisst_logo.png'
import { getAppGradient } from '../../../utils/appGradient'

const NAV = [
  { icon: Building2, label: 'Empresas', path: '/admin/empresas' },
  { icon: Users,      label: 'Usuarios', path: '/admin/usuarios' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { darkMode, setDarkMode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerAbierto, setDrawer] = useState(false)

  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const sidebar = darkMode ? '#0D1117' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const navActive = darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)'
  const navHover  = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const navColor  = '#818CF8'

  const nombre = user?.nombre || user?.email?.split('@')[0] || 'Administrador'

  const handleLogout = () => { logout(); navigate('/login') }

  const navLinks = (onNav) => NAV.map(({ icon: Icon, label, path }) => {
    const active = location.pathname === path
    return (
      <button key={path} onClick={() => { navigate(path); onNav?.() }} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 10, border: 'none',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        fontSize: 14, fontWeight: active ? 600 : 400,
        backgroundColor: active ? navActive : 'transparent',
        color: active ? navColor : sub,
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = navHover }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <Icon size={17} /> {label}
      </button>
    )
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: bg, transition: 'background-color 0.2s' }}>
      {/* ── Sidebar (escritorio) ── */}
      <aside className="hidden lg:flex flex-col" style={{
        width: 220, flexShrink: 0, backgroundColor: sidebar,
        borderRight: `1px solid ${border}`, padding: '20px 0',
      }}>
        <div className="px-5 pb-6 flex items-center justify-center">
          <img src={pisstLogo} alt="PISST" style={{ height: 70, objectFit: 'contain' }} />
        </div>
        <nav className="flex-1 px-2.5 flex flex-col gap-1">
          {navLinks()}
        </nav>
        <div className="px-2.5">
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, border: 'none',
            width: '100%', textAlign: 'left', cursor: 'pointer',
            fontSize: 13, color: '#EF4444', backgroundColor: 'transparent',
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Drawer (móvil/tablet) ── */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-[300] flex lg:hidden">
          <div onClick={() => setDrawer(false)} className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
          <div className="relative flex flex-col" style={{
            width: 240, maxWidth: '80vw', height: '100%',
            backgroundColor: sidebar, borderRight: `1px solid ${border}`, padding: '20px 0',
          }}>
            <div className="px-4 pb-5 flex items-center justify-between">
              <img src={pisstLogo} alt="PISST" style={{ height: 56, objectFit: 'contain' }} />
              <button onClick={() => setDrawer(false)} aria-label="Cerrar menú" style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${border}`, borderRadius: 8, color: sub, background: 'none',
              }}>
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 px-2.5 flex flex-col gap-1">
              {navLinks(() => setDrawer(false))}
            </nav>
            <div className="px-2.5">
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, border: 'none',
                width: '100%', textAlign: 'left', cursor: 'pointer',
                fontSize: 13, color: '#EF4444', backgroundColor: 'transparent',
              }}>
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Columna principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header style={{
          height: 60, flexShrink: 0, borderBottom: `1px solid ${border}`,
          backgroundColor: sidebar, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 14,
        }}>
          <button
            className="lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menú"
            style={{
              width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`,
              backgroundColor: card, color: sub, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Menu size={17} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="font-semibold text-sm truncate" style={{ color: text }}>Panel de Administración</p>
            <p className="text-xs truncate" style={{ color: sub }}>{nombre}</p>
          </div>

          <button
            onClick={() => setDarkMode(d => !d)}
            aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            style={{
              width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`,
              backgroundColor: card, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}
          >
            {darkMode ? <Sun size={16} style={{ color: '#FBBF24' }} /> : <Moon size={16} style={{ color: '#6366F1' }} />}
          </button>

          <button
            onClick={handleLogout}
            className="hidden lg:flex"
            style={{
              alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
              border: `1px solid ${border}`, backgroundColor: card, color: '#EF4444',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Salir
          </button>
        </header>

        <main style={{
          flex: 1, overflow: 'auto', minHeight: 0,
          background: getAppGradient(darkMode, bg), transition: 'background 0.2s',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
