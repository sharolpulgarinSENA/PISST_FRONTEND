/* eslint-disable react-refresh/only-export-components */
import { useState, createContext, useContext, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import {
  MessageSquare, Shield, Search, Moon, Sun,
  ChevronDown, LogOut, User, Circle, Settings, Bell, GraduationCap
} from 'lucide-react'
import pisstLogo from '../../../assets/imagenes/pisst_logo.png'
import { notificacionesAPI } from '../../../services/api'

export const TemaContext = createContext({ dark: true, setDark: () => {} })
export const useTema = () => useContext(TemaContext)

const NAV = [
  { icon: MessageSquare,  label: 'SASBOT',          path: '/empleado/chat'           },
  { icon: Shield,         label: 'Hacer Reporte',   path: '/empleado/reporte'        },
  { icon: GraduationCap,  label: 'Capacitaciones',  path: '/empleado/capacitaciones' },
]

const T = {
  dark: {
    bg:          '#0B0F1A',
    sidebar:     '#0D1117',
    border:      '#1E2433',
    card:        '#131929',
    text:        '#E2E8F0',
    textMuted:   '#94A3B8',
    textFaint:   '#64748B',
    navActive:   'rgba(99,102,241,0.15)',
    navHover:    'rgba(255,255,255,0.04)',
    navColor:    '#818CF8',
    searchBg:    '#131929',
    toggleActive:'#1E2433',
    dropdownBg:  '#161C2D',
  },
  light: {
    bg:          '#F1F5F9',
    sidebar:     '#FFFFFF',
    border:      '#E2E8F0',
    card:        '#F8FAFC',
    text:        '#0F172A',
    textMuted:   '#475569',
    textFaint:   '#94A3B8',
    navActive:   'rgba(99,102,241,0.10)',
    navHover:    'rgba(0,0,0,0.04)',
    navColor:    '#4F46E5',
    searchBg:    '#F1F5F9',
    toggleActive:'#E2E8F0',
    dropdownBg:  '#FFFFFF',
  }
}

export default function EmpleadoLayout() {
  const { user, logout }              = useAuth()
  const { darkMode, setDarkMode }     = useTheme()
  const navigate                      = useNavigate()
  const location                      = useLocation()
  const [menuAbierto, setMenu]        = useState(false)
  const [notifAbiertas, setNotif]     = useState(false)
  const [notificaciones, setNotifs]   = useState([])
  const [noLeidas, setNoLeidas]       = useState(0)
  const menuRef                       = useRef(null)
  const notifRef                      = useRef(null)

  const dark    = darkMode
  const tk      = dark ? T.dark : T.light
  const nombre  = user?.nombre || user?.email?.split('@')[0] || 'Empleado'
  const inicial = nombre[0]?.toUpperCase()

  const handleLogout = () => { logout(); navigate('/login') }

  // Cerrar dropdown usuario al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerrar panel notificaciones al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cargar notificaciones — defensivo contra cualquier forma del response
  const cargarNotifs = () => {
    notificacionesAPI.getFeed(10, 0)
      .then(res => {
        const raw = res.data
        const data = Array.isArray(raw) ? raw
          : Array.isArray(raw?.eventos) ? raw.eventos
          : Array.isArray(raw?.items) ? raw.items
          : Array.isArray(raw?.notificaciones) ? raw.notificaciones
          : []
        setNotifs(data)
        setNoLeidas(data.filter(n => !n.leido).length)
      })
      .catch(() => {})
  }

  useEffect(() => {
    cargarNotifs()
    const interval = setInterval(cargarNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const marcarLeida = (id) => {
    notificacionesAPI.marcarLeido(id)
      .then(() => {
        setNotifs(p => p.map(n => n.id === id ? { ...n, leido: true } : n))
        setNoLeidas(p => Math.max(0, p - 1))
      }).catch(() => {})
  }

  const marcarTodas = () => {
    notificacionesAPI.marcarTodasLeidas()
      .then(() => {
        setNotifs(p => p.map(n => ({ ...n, leido: true })))
        setNoLeidas(0)
      }).catch(() => {})
  }

  const MENU_ITEMS = [
    { icon: User,    label: 'Perfil',         action: () => { navigate('/empleado/perfil'); setMenu(false) } },
    { icon: Settings,label: 'Configuración',  action: () => { setMenu(false) } },
    { separador: true },
    { icon: LogOut,  label: 'Cerrar sesión',  action: handleLogout, danger: true },
  ]

  return (
    <TemaContext.Provider value={{ dark, setDark: setDarkMode, tk }}>
      <div style={{
        display: 'flex', minHeight: '100vh',
        backgroundColor: tk.bg,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        color: tk.text, transition: 'background-color 0.2s, color 0.2s'
      }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 200, flexShrink: 0,
          backgroundColor: tk.sidebar, borderRight: `1px solid ${tk.border}`,
          display: 'flex', flexDirection: 'column', padding: '20px 0',
          transition: 'background-color 0.2s, border-color 0.2s'
        }}>
          <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={pisstLogo} alt="PISST"
              style={{ height: 100, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>

          <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV.map(({ icon: Icon, label, path }) => {
              const active = location.pathname === path
              return (
                <button key={path} onClick={() => navigate(path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  backgroundColor: active ? tk.navActive : 'transparent',
                  color: active ? tk.navColor : tk.textMuted,
                  transition: 'all 0.15s', outline: 'none'
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = tk.navHover }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Icon size={17} /> {label}
                </button>
              )
            })}
          </nav>

          <div style={{
            margin: '0 10px', padding: '12px 14px', borderRadius: 12,
            backgroundColor: tk.card, border: `1px solid ${tk.border}`,
            transition: 'background-color 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff'
                }}>{inicial}</div>
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 9, height: 9, borderRadius: '50%',
                  backgroundColor: '#22C55E', border: `2px solid ${tk.card}`
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: tk.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{nombre}</div>
                <div style={{ fontSize: 11, color: tk.textFaint }}>Empleado</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Circle size={7} fill="#22C55E" /> En línea
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <header style={{
            height: 60, flexShrink: 0,
            borderBottom: `1px solid ${tk.border}`,
            backgroundColor: tk.sidebar,
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 16,
            transition: 'background-color 0.2s, border-color 0.2s',
            position: 'relative', zIndex: 50
          }}>
            <div style={{
              flex: 1, maxWidth: 440,
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: tk.searchBg, border: `1px solid ${tk.border}`,
              borderRadius: 10, padding: '8px 14px'
            }}>
              <Search size={15} color={tk.textFaint} />
              <span style={{ fontSize: 13, color: tk.textFaint }}>Buscar en PISST...</span>
              <span style={{
                marginLeft: 'auto', fontSize: 11, color: tk.textFaint,
                backgroundColor: tk.sidebar, padding: '2px 6px', borderRadius: 5,
                border: `1px solid ${tk.border}`
              }}>Ctrl + K</span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>

              {/* Toggle Dark / Light */}
              <div style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: tk.searchBg, border: `1px solid ${tk.border}`,
                borderRadius: 8, padding: 3
              }}>
                {[
                  { icon: Moon, val: true,  label: 'Dark'  },
                  { icon: Sun,  val: false, label: 'Light' },
                ].map(({ icon: Icon, val, label }) => (
                  <button key={label} onClick={() => setDarkMode(val)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6, border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    backgroundColor: dark === val ? tk.toggleActive : 'transparent',
                    color: dark === val ? tk.text : tk.textFaint, transition: 'all 0.15s'
                  }}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* ── Campana notificaciones ── */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => setNotif(p => !p)} style={{
                  position: 'relative', width: 36, height: 36,
                  borderRadius: 9, border: `1px solid ${notifAbiertas ? '#6366F1' : tk.border}`,
                  backgroundColor: notifAbiertas ? 'rgba(99,102,241,0.1)' : tk.card,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <Bell size={15} color={notifAbiertas ? '#818CF8' : tk.textMuted} />
                  {noLeidas > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 16, height: 16, borderRadius: 8,
                      backgroundColor: '#EF4444', color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', border: `2px solid ${tk.sidebar}`
                    }}>{noLeidas > 9 ? '9+' : noLeidas}</span>
                  )}
                </button>

                {notifAbiertas && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 320, maxHeight: 420, overflowY: 'auto',
                    backgroundColor: tk.dropdownBg, border: `1px solid ${tk.border}`,
                    borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                    zIndex: 100, animation: 'fadeDown 0.15s ease'
                  }}>
                    <div style={{
                      padding: '12px 16px', borderBottom: `1px solid ${tk.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: tk.text }}>
                        Notificaciones {noLeidas > 0 && <span style={{ color: '#EF4444' }}>({noLeidas})</span>}
                      </span>
                      {noLeidas > 0 && (
                        <button onClick={marcarTodas} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#6366F1', fontSize: 11, fontWeight: 500
                        }}>Marcar todas leídas</button>
                      )}
                    </div>

                    {notificaciones.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: tk.textFaint, fontSize: 13 }}>
                        <Bell size={24} color={tk.border} style={{ display: 'block', margin: '0 auto 8px' }} />
                        Sin notificaciones por ahora
                      </div>
                    ) : notificaciones.map(n => (
                      <div key={n.id}
                        onClick={() => { marcarLeida(n.id); if (n.url_destino) { setNotif(false); navigate(n.url_destino) } }}
                        style={{
                          padding: '12px 16px', cursor: n.url_destino ? 'pointer' : 'default',
                          borderBottom: `1px solid ${tk.border}`,
                          backgroundColor: n.leido ? 'transparent' : 'rgba(99,102,241,0.05)',
                          transition: 'background-color 0.15s',
                          display: 'flex', gap: 10, alignItems: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = tk.navHover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = n.leido ? 'transparent' : 'rgba(99,102,241,0.05)'}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                          backgroundColor: n.leido ? 'transparent' : '#6366F1'
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: n.leido ? 400 : 600, color: tk.text, marginBottom: 2 }}>
                            {n.titulo}
                          </div>
                          <div style={{ fontSize: 12, color: tk.textFaint, lineHeight: 1.4 }}>{n.descripcion}</div>
                          <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 4 }}>
                            {n.fecha ? new Date(n.fecha + 'Z').toLocaleString('es-CO', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              timeZone: 'America/Bogota'
                            }) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── User chip con dropdown ── */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <div onClick={() => setMenu(p => !p)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px 5px 5px',
                  backgroundColor: menuAbierto ? tk.navActive : tk.card,
                  border: `1px solid ${menuAbierto ? '#6366F1' : tk.border}`,
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s', userSelect: 'none'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff'
                  }}>{inicial}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tk.text, lineHeight: 1.2 }}>{nombre}</div>
                    <div style={{ fontSize: 11, color: tk.textFaint }}>Empleado</div>
                  </div>
                  <ChevronDown size={14} color={tk.textFaint} style={{
                    transition: 'transform 0.2s',
                    transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </div>

                {menuAbierto && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 200, backgroundColor: tk.dropdownBg,
                    border: `1px solid ${tk.border}`, borderRadius: 12,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                    overflow: 'hidden', zIndex: 100, animation: 'fadeDown 0.15s ease'
                  }}>
                    <style>{`
                      @keyframes fadeDown {
                        from { opacity: 0; transform: translateY(-6px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${tk.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>{nombre}</div>
                      <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 2 }}>{user?.email || 'Empleado'}</div>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                      {MENU_ITEMS.map((item, i) => {
                        if (item.separador) return (
                          <div key={i} style={{ height: 1, backgroundColor: tk.border, margin: '6px 0' }} />
                        )
                        const Icon = item.icon
                        return (
                          <button key={i} onClick={item.action} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px', border: 'none', cursor: 'pointer',
                            backgroundColor: 'transparent', textAlign: 'left',
                            color: item.danger ? '#EF4444' : tk.textMuted,
                            fontSize: 13, transition: 'background-color 0.12s'
                          }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(239,68,68,0.08)' : tk.navHover }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <Icon size={14} /> {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main style={{
            flex: 1, overflow: 'auto',
            backgroundColor: tk.bg, transition: 'background-color 0.2s'
          }}>
            <Outlet />
          </main>
        </div>
      </div>
    </TemaContext.Provider>
  )
}