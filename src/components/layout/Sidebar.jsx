import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, ShieldAlert,
  BookOpen, ClipboardList, Users, Settings,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import logo from '../../assets/imagenes/pisst_logo.png'
import logoIcono from '../../assets/imagenes/sincasco-removebg-preview.png'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',             path: '/dashboard' },
  { icon: AlertTriangle,   label: 'Incidentes',            path: '/incidentes' },
  { icon: ShieldAlert,     label: 'Evaluación de Riesgos', path: '/riesgos' },
  { icon: BookOpen,        label: 'Capacitaciones',        path: '/capacitaciones' },
  { icon: ClipboardList,   label: 'Auditorías',            path: '/auditorias' },
  { icon: Users,           label: 'Usuarios',              path: '/usuarios' },
  { icon: Settings,        label: 'Configuración',         path: '/configuracion' },
]

export default function Sidebar({ isMobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /* ============ Detectar si estamos en vista móvil/tablet (<lg = <1024px) ============ */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /* ============ Cuando se abre como drawer móvil, fuerza expandido ============ */
  const showExpanded = isMobile ? true : !collapsed

  /* ============ Handler navegación: cierra drawer en mobile ============ */
  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) onMobileClose?.()
  }

  return (
    <div
      className="flex flex-col justify-between h-screen transition-all duration-300 border-r"
      style={{
        width: showExpanded ? '220px' : '72px',
        backgroundColor: '#0B0F19',
        borderColor: '#1F2937'
      }}
    >
      <div>
        {/* ============ Logo ============ */}
        <div
          className={`flex items-center h-20 border-b transition-all duration-300 ${
            showExpanded ? 'justify-start px-5' : 'justify-center px-2'
          }`}
          style={{ borderColor: '#1F2937' }}
        >
          {showExpanded ? (
            <img
              src={logo}
              alt="PISST"
              className="object-contain object-left"
              style={{ width: '130px', height: 'auto' }}
            />
          ) : (
            <img
              src={logoIcono}
              alt="PISST Icono"
              className="object-contain"
              style={{ width: '60px', height: 'auto' }}
            />
          )}

          {/* ✕ Botón cerrar — SOLO visible en mobile cuando el drawer está abierto */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="ml-auto p-1.5 rounded-lg transition hover:opacity-80"
              style={{ color: '#9CA3AF' }}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* ============ Navegación ============ */}
        <nav className="mt-4 flex flex-col gap-1 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left"
                style={{
                  backgroundColor: active ? '#1A1F33' : 'transparent',
                  color: active ? '#6366F1' : '#9CA3AF',
                }}
              >
                <Icon size={18} className="shrink-0" />
                {showExpanded && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ============ Perfil y botón inferior ============ */}
      <div>
        {showExpanded && (
          <div className="mx-2 mb-3 p-3 rounded-xl" style={{ backgroundColor: '#111827' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: '#6366F1' }}
              >
                CR
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">Carlos Ramírez</p>
                <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>Coordinador SST</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>En línea</span>
            </div>
          </div>
        )}

        {/* ============ Botón inferior ============
            - Desktop: "Colapsar menú" / icono cuando ya está colapsado
            - Mobile (drawer): "Cerrar menú" con X
        */}
        {/* ============ Botón colapsar — SOLO desktop ============ */}
        {!isMobile && (
        <button
            onClick={() => setCollapsed(v => !v)}
            className="flex items-center gap-2 w-full px-4 py-3 border-t text-sm transition hover:opacity-80"
            style={{ color: '#9CA3A F', borderColor: '#1F2937' }}
        >
            {collapsed
            ? <ChevronRight size={16} className="mx-auto" />
            : <><ChevronLeft size={16} /><span>Colapsar menú</span></>
            }
        </button>
        )}
      </div>
    </div>
  )
}