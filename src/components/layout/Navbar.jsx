import { useState, useEffect, useRef } from 'react'
import {
  Search, Moon, Sun, Bell, ChevronDown, User, LogOut, X,
  AlertOctagon, AlertTriangle, RefreshCw, BookOpen, Calendar, CheckCircle,
  Clock, XCircle, ShieldAlert, ClipboardList, CheckSquare, FileSearch, FileCheck,
} from 'lucide-react'
import ConfirmDialog from '../ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { metricasAPI, notificacionesAPI } from '../../services/api'
import { normFecha, tiempoRelativo } from '../../utils/dates'

const NOTIF_LIMIT = 10

const ICONOS_EVENTO = {
  reporte_nuevo:                    AlertTriangle,
  reporte_estado_cambio:            RefreshCw,
  capacitacion_nueva:               BookOpen,
  capacitacion_sesion_programada:   Calendar,
  capacitacion_sesion_realizada:    CheckCircle,
  capacitacion_sesion_reprogramada: Clock,
  capacitacion_sesion_cancelada:    XCircle,
  riesgo_nuevo:                     ShieldAlert,
  accion_correctiva_nueva:          ClipboardList,
  accion_correctiva_completada:     CheckSquare,
  accion_correctiva_vencida:        AlertOctagon,
  accion_correctiva_proxima_vencer: Clock,
  auditoria_nueva:                  FileSearch,
  auditoria_vencida:                AlertOctagon,
  auditoria_proxima_vencer:         Clock,
  hallazgo_nuevo:                   Search,
  hallazgo_vencido:                 AlertOctagon,
  hallazgo_proximo_vencer:          Clock,
  investigacion_completada:         FileCheck,
  capacitacion_sesion_vencida:      AlertOctagon,
  capacitacion_sesion_proxima_vencer: Clock,
  riesgo_control_vencido:           AlertOctagon,
  riesgo_control_proximo_vencer:    Clock,
}

const SEARCH_DESTINOS = [
  { label: 'Dashboard',      path: '/dashboard',      roles: ['sst', 'gerencia'], keywords: 'inicio dashboard resumen' },
  { label: 'Reportes',       path: '/incidentes',     roles: ['sst', 'gerencia'], keywords: 'incidentes reportes accidentes' },
  { label: 'Capacitaciones', path: '/capacitaciones', roles: ['sst'],             keywords: 'capacitaciones formaciones cursos' },
  { label: 'Riesgos',        path: '/riesgos',        roles: ['sst'],             keywords: 'riesgos matriz peligros' },
  { label: 'Auditorías',     path: '/auditorias',     roles: ['sst'],             keywords: 'auditorias hallazgos' },
  { label: 'Usuarios',       path: '/usuarios',       roles: ['sst'],             keywords: 'usuarios empleados personas' },
  { label: 'Mi perfil',      path: '/perfil',         roles: ['sst', 'gerencia'], keywords: 'perfil cuenta contraseña foto' },
]


export default function Navbar({ darkMode, setDarkMode, onHamburguerClick, onMenuClick }) {
  const [dropdown, setDropdown] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const esGerencia = user?.role?.toString?.().toLowerCase?.() === 'gerencia'
  const rolActual = user?.role?.toString?.().toLowerCase?.()

  /* ── Búsqueda ── */
  const [busqueda, setBusqueda] = useState('')
  const mobileSearchRef = useRef(null)
  const desktopSearchRef = useRef(null)

  const opcionesBusqueda = SEARCH_DESTINOS.filter(d => d.roles.includes(rolActual))
  const resultadosBusqueda = busqueda.trim()
    ? opcionesBusqueda.filter(d => {
        const q = busqueda.trim().toLowerCase()
        return d.label.toLowerCase().includes(q) || d.keywords.includes(q)
      })
    : opcionesBusqueda

  function irABusqueda(path) {
    navigate(path)
    setBusqueda('')
    setMobileSearchOpen(false)
  }

  function manejarEnterBusqueda(e) {
    if (e.key === 'Enter' && resultadosBusqueda.length > 0) {
      irABusqueda(resultadosBusqueda[0].path)
    } else if (e.key === 'Escape') {
      setBusqueda('')
      setMobileSearchOpen(false)
    }
  }

  /* ── Usuario ── */
  const userRef = useRef(null)

  /* ── Notificaciones ── */
  const notifRef = useRef(null)
  const [panelOpen, setPanelOpen]       = useState(false)
  const [alertas, setAlertas]           = useState([])
  const [totalAlertas, setTotalAlertas] = useState(0)
  const [eventos, setEventos]           = useState([])
  const [totalEventos, setTotalEventos] = useState(0)
  const [offset, setOffset]             = useState(0)
  const [loadingNotif, setLoadingNotif] = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [marcandoTodas, setMarcandoTodas] = useState(false)

  useEffect(() => {
    cargarNotificaciones()
    const intervalo = setInterval(cargarNotificaciones, 60000)
    return () => clearInterval(intervalo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setDropdown(false)
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false)
      }
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setBusqueda('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function cargarNotificaciones() {
    setLoadingNotif(true)
    try {
      const [resAlertas, resFeed] = await Promise.all([
        metricasAPI.getAlertas(),
        notificacionesAPI.getFeed(NOTIF_LIMIT, 0),
      ])
      setAlertas(resAlertas.data?.alertas || [])
      setTotalAlertas(resAlertas.data?.total_alertas || 0)
      setEventos(resFeed.data?.eventos || [])
      setTotalEventos(resFeed.data?.total || 0)
      setOffset(0)
    } catch {
      // silencioso: el panel de notificaciones no es crítico
    } finally {
      setLoadingNotif(false)
    }
  }

  async function verMasEventos() {
    setLoadingMore(true)
    try {
      const nuevoOffset = offset + NOTIF_LIMIT
      const { data } = await notificacionesAPI.getFeed(NOTIF_LIMIT, nuevoOffset)
      setEventos((prev) => [...prev, ...(data?.eventos || [])])
      setTotalEventos(data?.total ?? totalEventos)
      setOffset(nuevoOffset)
    } catch {
      // silencioso
    } finally {
      setLoadingMore(false)
    }
  }

  async function marcarTodasLeidas() {
    setMarcandoTodas(true)
    try {
      await notificacionesAPI.marcarTodasLeidas()
      setEventos((prev) => prev.map((e) => ({ ...e, leido: true })))
    } catch {
      // silencioso
    } finally {
      setMarcandoTodas(false)
    }
  }

  function manejarClickAlerta(alerta) {
    setPanelOpen(false)
    if (alerta.url_destino) navigate(alerta.url_destino)
  }

  async function manejarClickEvento(evento) {
    if (!evento.leido) {
      try {
        await notificacionesAPI.marcarLeido(evento.id)
      } catch {
        // continuar de todas formas
      }
      setEventos((prev) => prev.map((e) => (e.id === evento.id ? { ...e, leido: true } : e)))
    }
    setPanelOpen(false)
    if (evento.url_destino) navigate(evento.url_destino)
  }

  const noLeidos   = eventos.filter((e) => !e.leido).length
  const badgeCount = totalAlertas + noLeidos
  const badgeColor = totalAlertas > 0 ? '#EF4444' : noLeidos > 0 ? '#F97316' : '#6366F1'

  const [confirmLogout, setConfirmLogout] = useState(false)

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
          style={{ color: darkMode ? '#CBD5E1' : '#6B7280' }}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 🔍 BÚSQUEDA — Versión MOBILE: solo icono que despliega input */}
        <div className="md:hidden relative" ref={mobileSearchRef}>
          <button
            onClick={() => setMobileSearchOpen(v => !v)}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{
              backgroundColor: darkMode ? '#111827' : '#F3F4F6',
              color: '#CBD5E1'
            }}
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>

          {mobileSearchOpen && (
            <div
              className="absolute left-0 top-12 z-50 rounded-lg shadow-xl"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
                width: 'calc(100vw - 24px)',
                maxWidth: '320px'
              }}
            >
              <div className="p-2 flex items-center gap-2">
                <Search size={15} style={{ color: '#CBD5E1' }} />
                <input
                  type="text"
                  autoFocus
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={manejarEnterBusqueda}
                  placeholder="Buscar en PISST..."
                  className="bg-transparent text-sm outline-none flex-1 min-w-0"
                  style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
                />
                <button onClick={() => { setMobileSearchOpen(false); setBusqueda('') }}>
                  <X size={16} style={{ color: '#CBD5E1' }} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto" style={{ borderTop: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}` }}>
                {resultadosBusqueda.length === 0 ? (
                  <div className="px-3 py-2 text-sm" style={{ color: '#CBD5E1' }}>Sin resultados</div>
                ) : resultadosBusqueda.map(d => (
                  <div
                    key={d.path}
                    onClick={() => irABusqueda(d.path)}
                    className="px-3 py-2 text-sm cursor-pointer transition hover:opacity-80"
                    style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🔍 BÚSQUEDA — Versión DESKTOP/TABLET: barra completa */}
        <div className="hidden md:block relative" ref={desktopSearchRef} style={{ width: '320px' }}>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: darkMode ? '#111827' : '#F3F4F6',
              width: '100%'
            }}
          >
            <Search size={15} style={{ color: '#CBD5E1' }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={manejarEnterBusqueda}
              placeholder="Buscar en PISST..."
              className="bg-transparent text-sm outline-none w-full min-w-0"
              style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')}>
                <X size={14} style={{ color: '#CBD5E1' }} />
              </button>
            )}
          </div>

          {busqueda && (
            <div
              className="absolute left-0 top-12 z-50 rounded-lg shadow-xl max-h-60 overflow-y-auto"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
                width: '100%'
              }}
            >
              {resultadosBusqueda.length === 0 ? (
                <div className="px-3 py-2 text-sm" style={{ color: '#CBD5E1' }}>Sin resultados</div>
              ) : resultadosBusqueda.map(d => (
                <div
                  key={d.path}
                  onClick={() => irABusqueda(d.path)}
                  className="px-3 py-2 text-sm cursor-pointer transition hover:opacity-80"
                  style={{ color: darkMode ? '#E5E7EB' : '#111827' }}
                >
                  {d.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ CENTRO: Acciones rápidas (solo desktop) ============ */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => navigate('/incidentes?nuevo=true')}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80"
          style={{
            backgroundColor: darkMode ? '#1A1F33' : '#F3F4F6',
            color: darkMode ? '#E5E7EB' : '#374151',
            border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`
          }}
        >
          + Nuevo reporte
        </button>
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
              color: darkMode ? '#E5E7EB' : '#CBD5E1'
            }}
          >
            <Moon size={13} /> Dark
          </button>
          <button
            onClick={() => setDarkMode(false)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition"
            style={{
              backgroundColor: !darkMode ? '#E5E7EB' : 'transparent',
              color: !darkMode ? '#111827' : '#CBD5E1'
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

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setPanelOpen((v) => {
              if (!v) cargarNotificaciones()
              return !v
            })}
            className="relative p-1"
            style={{ color: '#CBD5E1' }}
            aria-label="Notificaciones"
            aria-expanded={panelOpen}
            aria-haspopup="true"
          >
            <Bell size={18} />
            {badgeCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[10px] flex items-center justify-center"
                style={{ backgroundColor: badgeColor }}
              >
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <div
              className="absolute right-0 top-12 w-[90vw] max-w-sm sm:w-96 max-h-[28rem] flex flex-col rounded-xl shadow-xl z-50 overflow-hidden"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
              }}
            >
              {/* Cabecera */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: darkMode ? '#1F2937' : '#E5E7EB' }}
              >
                <p className="text-sm font-semibold" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
                  Notificaciones
                </p>
                <button
                  onClick={marcarTodasLeidas}
                  disabled={marcandoTodas || noLeidos === 0}
                  className="text-xs font-medium hover:underline disabled:opacity-50"
                  style={{ color: '#6366F1' }}
                >
                  Marcar todas como leídas
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {loadingNotif ? (
                  <p className="text-center text-sm py-8" style={{ color: '#CBD5E1' }}>Cargando...</p>
                ) : (
                  <>
                    {/* Sección A — Alertas del sistema */}
                    {totalAlertas > 0 && (
                      <div className="border-b" style={{ borderColor: darkMode ? '#1F2937' : '#E5E7EB' }}>
                        {alertas.map((a, i) => {
                          const Icon  = a.nivel === 'critico' ? AlertOctagon : AlertTriangle
                          const color = a.nivel === 'critico' ? '#EF4444' : '#F97316'
                          return (
                            <button
                              key={i}
                              onClick={() => manejarClickAlerta(a)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left transition hover:opacity-80"
                              style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)' }}
                            >
                              <Icon size={18} style={{ color }} className="shrink-0 mt-0.5" />
                              <p className="text-sm font-medium" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
                                {a.mensaje}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Sección B — Feed de eventos */}
                    {eventos.length === 0 ? (
                      <p className="text-center text-sm py-8" style={{ color: '#CBD5E1' }}>
                        No tienes notificaciones.
                      </p>
                    ) : (
                      eventos.map((ev) => {
                        const Icon = ICONOS_EVENTO[ev.tipo] || Bell
                        const esReporteNuevo = ev.tipo === 'reporte_nuevo'
                        return (
                          <div
                            key={ev.id}
                            onClick={esReporteNuevo ? undefined : () => manejarClickEvento(ev)}
                            className={`flex items-start gap-3 px-4 py-3 border-b transition ${esReporteNuevo ? '' : 'cursor-pointer hover:opacity-80'}`}
                            style={{
                              borderColor: darkMode ? '#1F2937' : '#E5E7EB',
                              backgroundColor: !ev.leido
                                ? (darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)')
                                : 'transparent',
                            }}
                          >
                            <Icon size={18} className="shrink-0 mt-0.5" style={{ color: '#6366F1' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
                                {ev.titulo}
                              </p>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#CBD5E1' }}>
                                {ev.descripcion}
                              </p>
                              <p className="text-[11px] mt-1" style={{ color: '#CBD5E1' }}>
                                {tiempoRelativo(ev.fecha)}
                              </p>
                              {esReporteNuevo && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); manejarClickEvento(ev) }}
                                  className="mt-2 text-xs font-semibold hover:underline"
                                  style={{ color: '#6366F1' }}
                                >
                                  Ver reporte →
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}

                    {/* Ver más */}
                    {eventos.length < totalEventos && (
                      <div className="flex justify-center py-3">
                        <button
                          onClick={verMasEventos}
                          disabled={loadingMore}
                          className="text-xs font-semibold hover:underline disabled:opacity-50"
                          style={{ color: '#6366F1' }}
                        >
                          {loadingMore ? 'Cargando...' : 'Ver más'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 USUARIO — burbuja de perfil (icono en móvil, completa en lg+) */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setDropdown(v => !v)}
            className="flex items-center gap-2"
            aria-label="Perfil"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: '#6366F1' }}
            >
              {user?.foto_url
                ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" />
                : (user?.nombre?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-semibold" style={{ color: darkMode ? '#E5E7EB' : '#111827' }}>
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs capitalize" style={{ color: '#CBD5E1' }}>
                {user?.role || ''}
              </p>
            </div>
            <ChevronDown size={14} className="hidden lg:block" style={{ color: '#CBD5E1' }} />
          </button>

          {dropdown && (
            <div
              className="absolute right-0 top-12 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl shadow-xl z-50 overflow-hidden"
              style={{
                backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`
              }}
            >
              {/* Cabecera con datos del usuario — solo visible en móvil/tablet */}
              <div
                className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: darkMode ? '#1F2937' : '#E5E7EB' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: '#6366F1' }}
                >
                  {user?.foto_url
                    ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" />
                    : (user?.nombre?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
                    {user?.nombre || 'Usuario'}
                  </p>
                  <p className="text-xs capitalize" style={{ color: '#CBD5E1' }}>
                    {user?.role || ''}
                  </p>
                </div>
              </div>

              {[
                { icon: User, label: 'Perfil', path: '/perfil' },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => { setDropdown(false); if (path) navigate(path) }}
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
                onClick={() => { setDropdown(false); setConfirmLogout(true) }}
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

      <ConfirmDialog
        open={confirmLogout}
        title="¿Cerrar sesión?"
        message="Se cerrará tu sesión actual. Asegúrate de haber guardado los cambios pendientes."
        confirmLabel="Cerrar sesión"
        danger
        onConfirm={() => { setConfirmLogout(false); logout(); navigate('/login') }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
