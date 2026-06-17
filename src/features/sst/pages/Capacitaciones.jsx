import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import {
  Plus, X, BookOpen, ChevronDown, Check, Power, PowerOff, Calendar, MapPin,
  Users, CheckCircle, XCircle, AlertCircle, AlertTriangle, RotateCcw, Ban,
  ClipboardList, Trash2, GraduationCap, Info, Pencil, Clock, Loader2
} from 'lucide-react'
import { capacitacionesAPI, areasAPI, usuariosAPI, getErrorMessage } from '../../../services/api'
import { normFecha, toColombiaISO, formatColombia, backendToInputLocal } from '../../../utils/dates'
import { usePaginacion } from '../../../hooks/usePaginacion'
import Paginador from '../../../components/Paginador'
import ConfirmDialog from '../../../components/ConfirmDialog'

/* ══════════════════════════════════════════
   UTILS (sin cambios)
══════════════════════════════════════════ */
function estadoSesion(s) {
  const estado = s.estado || 'programada'
  if (estado === 'cancelada')    return { key: 'cancelada',    label: 'Cancelada',           color: '#CBD5E1', bg: 'rgba(107,114,128,0.15)' }
  if (estado === 'realizada')    return { key: 'realizada',    label: 'Realizada',            color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   }
  if (estado === 'no_realizada') return { key: 'no_realizada', label: 'No realizada',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   }
  const normalized = /[Z+\-]\d{2}:\d{2}$|Z$/.test(s.fecha) ? s.fecha : s.fecha + 'Z'
  const esPasada = new Date(normalized) < new Date()
  if (esPasada) return { key: 'pendiente',  label: 'Pendiente de cierre', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  return           { key: 'programada',  label: 'Programada',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  }
}

/* ══════════════════════════════════════════
   HOOKS (sin cambios)
══════════════════════════════════════════ */
function useAreas() {
  const [areas, setAreas]     = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    areasAPI.getAll().then(r => setAreas(r.data)).catch(() => setAreas([])).finally(() => setLoading(false))
  }, [])
  return { areas, loading }
}

function useEmpleadosPorAreas(areaIds) {
  const [todos, setTodos]     = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    usuariosAPI.getAll(0, 200).then(r => setTodos(r.data)).catch(() => setTodos([])).finally(() => setLoading(false))
  }, [])
  const empleados = useMemo(() => {
    if (!areaIds?.length) return todos.filter(u => u.role === 'empleado' && u.activo)
    return todos.filter(u => u.role === 'empleado' && u.activo && areaIds.includes(u.area_id))
  }, [todos, areaIds])
  return { empleados, loading }
}

/* ══════════════════════════════════════════
   COMPONENTES ATÓMICOS (sin cambios)
══════════════════════════════════════════ */
function SelectorAreas({ areas, selected, onChange, darkMode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  const label = selected.length === 0 ? 'Sin áreas asignadas'
    : selected.length === 1 ? areas.find(a => a.id === selected[0])?.nombre ?? '1 área'
    : `${selected.length} áreas seleccionadas`
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none"
        style={{ backgroundColor: input, color: selected.length ? text : sub, border: `1px solid ${border}` }}>
        <span className="truncate">{label}</span>
        <ChevronDown size={14} style={{ color: sub, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="absolute z-50 w-full bottom-full mb-1 rounded-xl shadow-xl overflow-hidden" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          {areas.length === 0
            ? <p className="px-3 py-3 text-xs" style={{ color: sub }}>No hay áreas disponibles.</p>
            : <ul className="max-h-48 overflow-y-auto py-1">
                {areas.map(a => {
                  const sel = selected.includes(a.id)
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => toggle(a.id)}
                        className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-indigo-500/10 transition"
                        style={{ color: sel ? '#6366F1' : text }}>
                        <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: sel ? '#6366F1' : input, border: `1px solid ${sel ? '#6366F1' : border}` }}>
                          {sel && <Check size={10} color="#fff" />}
                        </span>
                        {a.nombre}
                      </button>
                    </li>
                  )
                })}
              </ul>
          }
        </div>
      )}
    </div>
  )
}

function BadgeEstado({ estado }) {
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
          style={{ backgroundColor: estado.bg, color: estado.color }}>
      {estado.label}
    </span>
  )
}

/* ══════════════════════════════════════════
   MODAL: CERRAR SESIÓN (sin cambios)
══════════════════════════════════════════ */
function ModalCerrarSesion({ darkMode, sesion, onClose, onConfirmar, loading }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
          <h3 className="font-bold text-base" style={{ color: text }}>Cerrar sesión</h3>
          <button onClick={onClose} disabled={loading}><X size={16} style={{ color: sub }} /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
            <p className="text-sm font-medium" style={{ color: text }}>{formatColombia(sesion.fecha)}</p>
            {sesion.lugar && <p className="text-xs mt-0.5" style={{ color: sub }}>{sesion.lugar}</p>}
          </div>
          <p className="text-sm" style={{ color: sub }}>¿Cómo terminó esta sesión?</p>
          <div className="space-y-2">
            <button onClick={() => onConfirmar('realizada')} disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }}>
              <CheckCircle size={16} /> Se realizó con éxito
            </button>
            <button onClick={() => onConfirmar('no_realizada')} disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }}>
              <XCircle size={16} /> No se realizó
            </button>
          </div>
        </div>
        <div className="flex justify-end px-5 py-3 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PANEL DE ASISTENCIA (sin cambios)
══════════════════════════════════════════ */
function PanelAsistencia({ sesion, capacitacion, theme }) {
  const { darkMode } = useTheme()
  const { text, sub, input, border } = theme
  const areaIds = capacitacion.areas?.map(a => a.id) ?? []
  const { empleados, loading: loadingEmp } = useEmpleadosPorAreas(areaIds)
  const [asistencia, setAsistencia]   = useState({})
  const [guardando, setGuardando]     = useState({})
  const [loadingAsis, setLoadingAsis] = useState(true)
  const [errorMsg, setErrorMsg]       = useState('')
  const [okMsg, setOkMsg]             = useState('')
  const [marcandoTodos, setMarcandoTodos] = useState(false)

  useEffect(() => {
    setLoadingAsis(true)
    capacitacionesAPI.getAsistencia(sesion.id)
      .then(r => {
        const map = {}
        const VALID = ['presente', 'ausente', 'justificado']
        r.data.forEach(a => { if (VALID.includes(a.estado)) map[a.empleado_id] = a.estado })
        setAsistencia(map)
      })
      .catch(() => {})
      .finally(() => setLoadingAsis(false))
  }, [sesion.id])

  const showOk = (msg) => {
    setErrorMsg('')
    setOkMsg(msg)
    setTimeout(() => setOkMsg(''), 2500)
  }

  const marcar = async (empleadoId, estado, nombre) => {
    setGuardando(g => ({ ...g, [empleadoId]: true }))
    try {
      await capacitacionesAPI.registrarAsistencia({ sesion_id: sesion.id, empleado_id: empleadoId, estado })
      setAsistencia(a => ({ ...a, [empleadoId]: estado }))
      showOk(`Asistencia de ${nombre} guardada.`)
    } catch (e) {
      setErrorMsg(`No se pudo guardar la asistencia de ${nombre}. Intenta de nuevo.`)
    }
    finally { setGuardando(g => ({ ...g, [empleadoId]: false })) }
  }

  const marcarTodosPresentes = async () => {
    setMarcandoTodos(true)
    setErrorMsg('')
    const pendientes = empleados.filter(emp => asistencia[emp.id] !== 'presente')
    for (const emp of pendientes) {
      await marcar(emp.id, 'presente', emp.nombre)
    }
    setMarcandoTodos(false)
    showOk('Asistencia guardada para todos los empleados presentes.')
  }

  const ESTADOS = [
    { value: 'presente',    label: 'Presente',    icon: CheckCircle, color: '#22C55E' },
    { value: 'ausente',     label: 'Ausente',     icon: XCircle,     color: '#EF4444' },
    { value: 'justificado', label: 'Justificado', icon: AlertCircle, color: '#F59E0B' },
  ]

  if (loadingAsis || loadingEmp) return <p className="text-sm text-center py-6" style={{ color: sub }}>Cargando empleados…</p>
  if (empleados.length === 0) return (
    <div className="text-center py-8">
      <Users size={32} className="mx-auto mb-2" style={{ color: sub }} />
      <p className="text-sm" style={{ color: sub }}>
        {areaIds.length === 0 ? 'Esta capacitación no tiene áreas asignadas.' : 'No hay empleados activos en las áreas asignadas.'}
      </p>
    </div>
  )

  const total     = empleados.length
  const presentes = Object.values(asistencia).filter(e => e === 'presente').length
  const ausentes  = Object.values(asistencia).filter(e => e === 'ausente').length
  const justif    = Object.values(asistencia).filter(e => e === 'justificado').length

  const hayPendientes = empleados.some(emp => asistencia[emp.id] !== 'presente')

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="text-sm rounded-lg px-4 py-3"
             style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
          {errorMsg}
        </div>
      )}
      {okMsg && (
        <div className="text-sm rounded-lg px-4 py-3"
             style={{ backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${darkMode ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, color: darkMode ? '#86EFAC' : '#15803D' }}>
          {okMsg}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Presentes',    value: presentes, color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
          { label: 'Ausentes',     value: ausentes,  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
          { label: 'Justificados', value: justif,    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: s.bg }}>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: sub }}>{total} empleados en esta capacitación</p>
        <button onClick={marcarTodosPresentes} disabled={marcandoTodos || !hayPendientes}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
          style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
          <CheckCircle size={12} /> {marcandoTodos ? 'Marcando...' : 'Marcar todos como presentes'}
        </button>
      </div>
      <div className="space-y-2">
        {empleados.map(emp => {
          const estadoActual = asistencia[emp.id]
          const cargando     = guardando[emp.id]
          return (
            <div key={emp.id} className="rounded-lg p-3 flex items-center justify-between gap-3" style={{ backgroundColor: input }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: text }}>{emp.nombre}</p>
                <p className="text-xs truncate" style={{ color: sub }}>{emp.cargo_nombre ?? 'Sin cargo'} · {emp.area_nombre ?? 'Sin área'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {ESTADOS.map(e => {
                  const activo = estadoActual === e.value
                  const Icon   = e.icon
                  return (
                    <button key={e.value} onClick={() => !cargando && marcar(emp.id, e.value, emp.nombre)}
                      disabled={cargando} title={e.label}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                      style={{ backgroundColor: activo ? e.color + '22' : 'transparent', border: `1px solid ${activo ? e.color : border}`, color: activo ? e.color : sub }}>
                      <Icon size={15} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ✅ NUEVO: PANEL DE EVALUACIONES
   Solo para sesiones con estado "realizada"
   El SST crea evaluación con preguntas
══════════════════════════════════════════ */
const OPCIONES = ['a', 'b', 'c', 'd']
const OPCION_LABEL = { a: 'A', b: 'B', c: 'C', d: 'D' }

function preguntaVacia() {
  return { texto: '', opcion_a: '', opcion_b: '', opcion_c: '', opcion_d: '', respuesta_correcta: 'a' }
}

function PanelEvaluaciones({ sesion, theme }) {
  const { text, sub, input, border, card } = theme

  const [evaluacion, setEvaluacion]   = useState(null) // evaluación existente si ya hay una
  const [loadingEval, setLoadingEval] = useState(false)
  const [modo, setModo]               = useState('ver') // 'ver' | 'crear'
  const [banner, setBanner]           = useState({ type: '', msg: '' })

  // Form para crear
  const [titulo, setTitulo]               = useState('')
  const [puntajeMin, setPuntajeMin]       = useState(60)
  const [preguntas, setPreguntas]         = useState([preguntaVacia()])
  const [guardando, setGuardando]         = useState(false)

  // Cargar evaluación existente de esta sesión (si tiene)
  // El backend no tiene GET evaluación por sesión directamente, pero
  // al crear devuelve la evaluación completa con preguntas
  // La guardamos en estado local al crearla

  const setPregunta = (i, campo, valor) =>
    setPreguntas(ps => ps.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))

  const agregarPregunta = () => {
    if (preguntas.length >= 20) return
    setPreguntas(ps => [...ps, preguntaVacia()])
  }

  const eliminarPregunta = (i) => {
    if (preguntas.length <= 1) return
    setPreguntas(ps => ps.filter((_, idx) => idx !== i))
  }

  const guardarEvaluacion = async () => {
    setBanner({ type: '', msg: '' })
    if (!titulo.trim()) { setBanner({ type: 'error', msg: 'El título es obligatorio.' }); return }
    if (preguntas.length < 1) { setBanner({ type: 'error', msg: 'Agrega al menos 1 pregunta.' }); return }

    const preguntasInvalidas = preguntas.some(
      p => !p.texto.trim() || !p.opcion_a.trim() || !p.opcion_b.trim() || !p.opcion_c.trim() || !p.opcion_d.trim()
    )
    if (preguntasInvalidas) { setBanner({ type: 'error', msg: 'Completa todos los campos de cada pregunta.' }); return }

    setGuardando(true)
    try {
      const { data } = await capacitacionesAPI.crearEvaluacion({
        titulo:         titulo.trim(),
        puntaje_minimo: Number(puntajeMin),
        sesion_id:      sesion.id,
        preguntas:      preguntas.map(p => ({
          texto:               p.texto.trim(),
          opcion_a:            p.opcion_a.trim(),
          opcion_b:            p.opcion_b.trim(),
          opcion_c:            p.opcion_c.trim(),
          opcion_d:            p.opcion_d.trim(),
          respuesta_correcta:  p.respuesta_correcta,
        })),
      })
      setEvaluacion(data)
      setModo('ver')
      setBanner({ type: 'ok', msg: 'Evaluación creada correctamente.' })
    } catch (err) {
      setBanner({ type: 'error', msg: getErrorMessage(err, 'Error al crear la evaluación.') })
    } finally { setGuardando(false) }
  }

  // ── Vista: ya existe evaluación ──
  if (evaluacion && modo === 'ver') {
    return (
      <div className="space-y-4">
        {banner.msg && (
          <div className={`text-sm rounded-lg px-4 py-3 border ${banner.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {banner.msg}
          </div>
        )}

        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>{evaluacion.titulo}</p>
              <p className="text-xs mt-0.5" style={{ color: sub }}>
                Puntaje mínimo: {evaluacion.puntaje_minimo}% · {evaluacion.preguntas?.length ?? 0} preguntas
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
              Creada ✓
            </span>
          </div>

          {/* Lista de preguntas */}
          <div className="space-y-2 pt-1">
            {evaluacion.preguntas?.map((p, i) => (
              <div key={p.id} className="rounded-lg p-3" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
                <p className="text-xs font-semibold mb-2" style={{ color: text }}>
                  {i + 1}. {p.texto}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {OPCIONES.map(op => (
                    <p key={op} className="text-xs" style={{ color: sub }}>
                      <span className="font-medium" style={{ color: text }}>{OPCION_LABEL[op]}.</span> {p[`opcion_${op}`]}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <GraduationCap size={16} style={{ color: '#6366F1', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: '#818CF8' }}>
            Los empleados podrán responder esta evaluación desde el módulo de empleado.
            Si aprueban, podrán descargar su certificado.
          </p>
        </div>
      </div>
    )
  }

  // ── Vista: crear evaluación ──
  if (modo === 'crear') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: text }}>Nueva evaluación</p>
          <button onClick={() => { setModo('ver'); setBanner({ type: '', msg: '' }) }}
            className="text-xs hover:opacity-70" style={{ color: sub }}>
            ← Cancelar
          </button>
        </div>

        {banner.msg && (
          <div className={`text-sm rounded-lg px-4 py-3 border ${banner.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {banner.msg}
          </div>
        )}

        {/* Título + puntaje */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Título de la evaluación *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Evaluación final EPP"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Puntaje mínimo (%)</label>
            <input type="number" min={1} max={100} value={puntajeMin}
              onChange={e => setPuntajeMin(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-4">
          {preguntas.map((p, i) => (
            <div key={i} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: '#6366F1' }}>Pregunta {i + 1}</p>
                {preguntas.length > 1 && (
                  <button onClick={() => eliminarPregunta(i)} className="hover:opacity-70" title="Eliminar pregunta">
                    <Trash2 size={13} style={{ color: '#EF4444' }} />
                  </button>
                )}
              </div>

              {/* Texto */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: sub }}>Enunciado *</label>
                <textarea rows={2} value={p.texto} onChange={e => setPregunta(i, 'texto', e.target.value)}
                  placeholder="Escribe la pregunta..."
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
              </div>

              {/* Opciones */}
              <div className="grid grid-cols-2 gap-2">
                {OPCIONES.map(op => (
                  <div key={op}>
                    <label className="text-xs mb-1 flex items-center gap-1.5" style={{ color: sub }}>
                      <span className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: p.respuesta_correcta === op ? '#6366F1' : 'transparent',
                                     color: p.respuesta_correcta === op ? '#fff' : sub,
                                     border: `1px solid ${p.respuesta_correcta === op ? '#6366F1' : border}` }}>
                        {OPCION_LABEL[op]}
                      </span>
                      Opción {OPCION_LABEL[op]}
                      {p.respuesta_correcta === op && <span style={{ color: '#22C55E', fontSize: 10 }}>✓ Correcta</span>}
                    </label>
                    <input type="text" value={p[`opcion_${op}`]}
                      onChange={e => setPregunta(i, `opcion_${op}`, e.target.value)}
                      placeholder={`Opción ${OPCION_LABEL[op]}`}
                      className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
                      style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                  </div>
                ))}
              </div>

              {/* Respuesta correcta */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: sub }}>Respuesta correcta</label>
                <div className="flex gap-2">
                  {OPCIONES.map(op => (
                    <button key={op} type="button" onClick={() => setPregunta(i, 'respuesta_correcta', op)}
                      className="w-9 h-9 rounded-lg text-sm font-bold transition"
                      style={{
                        backgroundColor: p.respuesta_correcta === op ? '#6366F1' : 'transparent',
                        color:           p.respuesta_correcta === op ? '#fff'    : sub,
                        border: `1px solid ${p.respuesta_correcta === op ? '#6366F1' : border}`,
                      }}>
                      {OPCION_LABEL[op]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agregar pregunta */}
        {preguntas.length < 20 && (
          <button onClick={agregarPregunta} type="button"
            className="w-full py-2 rounded-lg text-sm font-medium transition"
            style={{ color: '#6366F1', border: `1px dashed ${border}`, backgroundColor: 'transparent' }}>
            + Agregar pregunta ({preguntas.length}/20)
          </button>
        )}

        {/* Guardar */}
        <button onClick={guardarEvaluacion} disabled={guardando}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#6366F1' }}>
          {guardando ? 'Guardando...' : 'Crear evaluación'}
        </button>
      </div>
    )
  }

  // ── Vista: sin evaluación aún ──
  return (
    <div className="space-y-4">
      {banner.msg && (
        <div className={`text-sm rounded-lg px-4 py-3 border ${banner.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {banner.msg}
        </div>
      )}
      <div className="text-center py-8 space-y-3">
        <ClipboardList size={36} className="mx-auto" style={{ color: sub }} />
        <p className="text-sm font-medium" style={{ color: text }}>Sin evaluación</p>
        <p className="text-xs" style={{ color: sub }}>
          Crea una evaluación para que los empleados puedan responderla y obtener su certificado.
        </p>
        <button onClick={() => setModo('crear')}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#6366F1' }}>
          Crear evaluación
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: NUEVA CAPACITACIÓN (sin cambios)
══════════════════════════════════════════ */
function ModalNuevaCapacitacion({ darkMode, onClose, onCreada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const { areas, loading: loadingAreas } = useAreas()
  const [form, setForm]       = useState({ titulo: '', objetivos: '', duracion_horas: 1 })
  const [areaIds, setAreaIds] = useState([])
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.titulo) { setErrores({ titulo: true }); setBanner('El título es obligatorio.'); return }
    setBanner(''); setLoading(true)
    try {
      await capacitacionesAPI.crear({
        titulo: form.titulo, objetivos: form.objetivos || undefined,
        duracion_horas: Number(form.duracion_horas),
        area_ids: areaIds.length > 0 ? areaIds : undefined,
      })
      onCreada(); onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al crear la capacitación.'))
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nueva Capacitación</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Título *</label>
            <input type="text" placeholder="Ej: Manejo de EPP" value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores.titulo ? 'border-red-500' : 'border-transparent'}`}
              style={{ backgroundColor: input, color: text }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos</label>
            <textarea rows={3} placeholder="Describe los objetivos..." value={form.objetivos}
              onChange={e => set('objetivos', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent resize-none"
              style={{ backgroundColor: input, color: text }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Duración (horas)</label>
            <input type="number" min={1} value={form.duracion_horas}
              onChange={e => set('duracion_horas', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
              style={{ backgroundColor: input, color: text }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              Áreas dirigidas {loadingAreas && <span className="opacity-50">(cargando…)</span>}
            </label>
            <SelectorAreas areas={areas} selected={areaIds} onChange={setAreaIds} darkMode={darkMode} />
            <p className="text-xs mt-1" style={{ color: sub }}>Opcional — puedes asignar áreas después.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Creando...' : 'Crear capacitación'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: REPROGRAMAR (sin cambios)
══════════════════════════════════════════ */
function ModalReprogramar({ darkMode, sesion, onClose, onReprogramada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const [form, setForm]       = useState({ fecha: backendToInputLocal(sesion.fecha), lugar: sesion.lugar ?? '' })
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const guardar = async () => {
    if (!form.fecha) { setBanner('La fecha es obligatoria.'); return }
    setBanner(''); setLoading(true)
    try {
      const body = {}
      if (form.fecha) body.fecha = toColombiaISO(form.fecha)
      if (form.lugar) body.lugar = form.lugar
      await capacitacionesAPI.reprogramarSesion(sesion.id, body)
      onReprogramada(); onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al reprogramar la sesión.'))
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
          <h3 className="font-bold text-base" style={{ color: text }}>Reprogramar sesión</h3>
          <button onClick={onClose}><X size={16} style={{ color: sub }} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{banner}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              <Calendar size={11} className="inline mr-1" />Nueva fecha y hora *
            </label>
            <input type="datetime-local" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
            <p className="text-xs mt-1" style={{ color: sub }}>Hora Colombia (UTC−5)</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              <MapPin size={11} className="inline mr-1" />Lugar
            </label>
            <input type="text" placeholder="Ej: Auditorio principal" value={form.lugar}
              onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Guardando...' : 'Reprogramar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   FILA DE SESIÓN — con pestaña evaluación
══════════════════════════════════════════ */
function FilaSesion({ sesion, theme, onReprogramar, onAsistencia, onCerrar, onCambiarEstado, accionEnCurso, onEvaluacion }) {
  const { text, sub, input } = theme
  const estado = estadoSesion(sesion)

  const puedeReprogramar = estado.key === 'programada' || estado.key === 'pendiente'
  const puedeCancelar    = estado.key === 'programada' || estado.key === 'pendiente'
  const puedeCerrar      = estado.key === 'pendiente'
  const puedeAsistencia  = estado.key === 'pendiente' || estado.key === 'realizada'
  const puedeReabrir     = estado.key === 'no_realizada' || estado.key === 'cancelada'
  const puedeEvaluacion  = estado.key === 'realizada'

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: text }}>{formatColombia(sesion.fecha)}</p>
          {sesion.lugar && <p className="text-xs mt-0.5 truncate" style={{ color: sub }}>{sesion.lugar}</p>}
        </div>
        <BadgeEstado estado={estado} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-3">
        {puedeCerrar && (
          <button onClick={() => onCerrar(sesion)} disabled={accionEnCurso}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.12)' }}>
            <CheckCircle size={12} /> Cerrar sesión
          </button>
        )}
        {puedeAsistencia && (
          <button onClick={() => onAsistencia(sesion)} disabled={accionEnCurso}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }}>
            <Users size={12} /> Asistencia
          </button>
        )}
        {puedeEvaluacion && (
          <button onClick={() => onEvaluacion(sesion)} disabled={accionEnCurso}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' }}>
            <ClipboardList size={12} /> Evaluación
          </button>
        )}
        {puedeReprogramar && (
          <button onClick={() => onReprogramar(sesion)} disabled={accionEnCurso}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#6366F1', backgroundColor: 'rgba(99,102,241,0.1)' }}>
            <Calendar size={12} /> Reprogramar
          </button>
        )}
        {puedeCancelar && (
          <button onClick={() => onCambiarEstado(sesion, 'cancelada')} disabled={accionEnCurso}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#CBD5E1', backgroundColor: 'rgba(107,114,128,0.12)' }}>
            <Ban size={12} /> Cancelar
          </button>
        )}
        {puedeReabrir && (
          <button onClick={() => onCambiarEstado(sesion, 'programada')} disabled={accionEnCurso}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#6366F1', backgroundColor: 'rgba(99,102,241,0.1)' }}>
            <RotateCcw size={12} /> Reabrir
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE CAPACITACIÓN
   ✅ Con panel de evaluación integrado
══════════════════════════════════════════ */
function ModalDetalle({ darkMode, capacitacion: capInicial, onClose, onActualizada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const theme  = { card, border, text, sub, input }

  const [capacitacion, setCapacitacion]         = useState(capInicial)
  const [tab, setTab]                           = useState('sesiones')
  const [sesiones, setSesiones]                 = useState([])
  const [sesionAsistencia, setSesionAsistencia] = useState(null)
  const [sesionEvaluacion, setSesionEvaluacion] = useState(null)
  const [sesionReprogramar, setSesionReprogramar] = useState(null)
  const [sesionCerrar, setSesionCerrar]         = useState(null)
  const [banner, setBanner]                     = useState('')
  const [sesionForm, setSesionForm]             = useState({ fecha: '', lugar: '' })
  const [loading, setLoading]                   = useState(false)
  const [loadingToggle, setLoadingToggle]       = useState(false)
  const [accionSesion, setAccionSesion]         = useState(false)
  const [confirmCancelar, setConfirmCancelar]   = useState(null)
  const [confirmEliminar, setConfirmEliminar]   = useState(false)
  const [confirmSuspender, setConfirmSuspender] = useState(false)
  const [eliminando, setEliminando]             = useState(false)

  const { areas, loading: loadingAreas } = useAreas()
  const [editForm, setEditForm] = useState({
    titulo: capInicial.titulo, objetivos: capInicial.objetivos ?? '', duracion_horas: capInicial.duracion_horas,
  })
  const [editAreaIds, setEditAreaIds] = useState(capInicial.areas?.map(a => a.id) ?? [])
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [bannerEdit, setBannerEdit]   = useState({ type: '', msg: '' })
  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  const cargarSesiones = () =>
    capacitacionesAPI.getSesiones(capacitacion.id).then(r => setSesiones(r.data))
      .catch(() => setBanner('No se pudieron cargar las sesiones de esta capacitación. Intenta de nuevo.'))

  useEffect(() => { cargarSesiones() }, [capacitacion.id])

  const toggleActivo = async () => {
    setLoadingToggle(true); setBanner('')
    try {
      const { data } = capacitacion.activo
        ? await capacitacionesAPI.suspender(capacitacion.id)
        : await capacitacionesAPI.activar(capacitacion.id)
      setCapacitacion(data); onActualizada()
    } catch (err) { setBanner(getErrorMessage(err, 'Error al cambiar el estado.'))
    } finally { setLoadingToggle(false) }
  }

  const crearSesion = async () => {
    if (!sesionForm.fecha) { setBanner('La fecha es obligatoria.'); return }
    setBanner(''); setLoading(true)
    try {
      await capacitacionesAPI.crearSesion({
        fecha: toColombiaISO(sesionForm.fecha), lugar: sesionForm.lugar || undefined, capacitacion_id: capacitacion.id,
      })
      await cargarSesiones(); setSesionForm({ fecha: '', lugar: '' })
    } catch (err) { setBanner(getErrorMessage(err, 'Error al crear la sesión.'))
    } finally { setLoading(false) }
  }

  const cambiarEstadoSesion = async (sesion, estado) => {
    setAccionSesion(true); setBanner('')
    try {
      await capacitacionesAPI.cambiarEstadoSesion(sesion.id, estado)
      await cargarSesiones(); onActualizada(); setSesionCerrar(null)
    } catch (err) { setBanner(getErrorMessage(err, 'Error al cambiar el estado de la sesión.'))
    } finally { setAccionSesion(false) }
  }

  const solicitarCambioEstado = (sesion, estado) => {
    if (estado === 'cancelada') { setConfirmCancelar(sesion); return }
    cambiarEstadoSesion(sesion, estado)
  }

  const eliminarCapacitacion = async () => {
    setEliminando(true)
    try {
      await capacitacionesAPI.eliminar(capacitacion.id)
      onActualizada(); onClose()
    } catch (err) {
      setBannerEdit({ type: 'error', msg: getErrorMessage(err, 'Error al eliminar la capacitación.') })
      setConfirmEliminar(false)
    } finally { setEliminando(false) }
  }

  const guardarEdicion = async () => {
    if (!editForm.titulo.trim()) { setBannerEdit({ type: 'error', msg: 'El título es obligatorio.' }); return }
    setBannerEdit({ type: '', msg: '' }); setLoadingEdit(true)
    try {
      const { data } = await capacitacionesAPI.actualizar(capacitacion.id, {
        titulo: editForm.titulo.trim(), objetivos: editForm.objetivos.trim() || undefined,
        duracion_horas: Number(editForm.duracion_horas), area_ids: editAreaIds,
      })
      setCapacitacion(data); onActualizada()
      setBannerEdit({ type: 'ok', msg: 'Cambios guardados correctamente.' })
    } catch (err) { setBannerEdit({ type: 'error', msg: getErrorMessage(err, 'Error al guardar.') })
    } finally { setLoadingEdit(false) }
  }

  const esActiva = capacitacion.activo
  const TABS = [
    { id: 'sesiones', label: 'Sesiones',    Icon: Calendar },
    { id: 'info',     label: 'Información', Icon: Info     },
    { id: 'editar',   label: 'Editar',      Icon: Pencil   },
  ]

  // ── Vista asistencia ──
  if (sesionAsistencia) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <button onClick={() => setSesionAsistencia(null)} className="text-xs flex items-center gap-1 mb-1 hover:opacity-70" style={{ color: '#6366F1' }}>
              ← Volver a sesiones
            </button>
            <h2 className="font-bold text-base" style={{ color: text }}>Control de asistencia</h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {formatColombia(sesionAsistencia.fecha)} {sesionAsistencia.lugar ? `· ${sesionAsistencia.lugar}` : ''}
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <PanelAsistencia sesion={sesionAsistencia} capacitacion={capacitacion} theme={theme} />
        </div>
      </div>
    </div>
  )

  // ── Vista evaluación ──
  if (sesionEvaluacion) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <button onClick={() => setSesionEvaluacion(null)} className="text-xs flex items-center gap-1 mb-1 hover:opacity-70" style={{ color: '#6366F1' }}>
              ← Volver a sesiones
            </button>
            <h2 className="font-bold text-base" style={{ color: text }}>Evaluación de sesión</h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {formatColombia(sesionEvaluacion.fecha)} {sesionEvaluacion.lugar ? `· ${sesionEvaluacion.lugar}` : ''}
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <PanelEvaluaciones sesion={sesionEvaluacion} theme={theme} />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: card, border: `1px solid ${border}` }}>

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b gap-3" style={{ borderColor: border }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg truncate" style={{ color: text }}>{capacitacion.titulo}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: esActiva ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: esActiva ? '#22C55E' : '#CBD5E1' }}>
                  {esActiva ? 'Activa' : 'Suspendida'}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: sub }}>
                {capacitacion.duracion_horas}h {capacitacion.areas?.length > 0 && <> · {capacitacion.areas.map(a => a.nombre).join(', ')}</>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => esActiva ? setConfirmSuspender(true) : toggleActivo()} disabled={loadingToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: esActiva ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)', color: esActiva ? '#EF4444' : '#6366F1' }}>
                {loadingToggle ? '...' : esActiva ? <><PowerOff size={13} /> Suspender</> : <><Power size={13} /> Activar</>}
              </button>
              <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6" style={{ borderColor: border }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setBanner('') }}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition"
                style={{ borderColor: tab === t.id ? '#6366F1' : 'transparent', color: tab === t.id ? '#6366F1' : sub }}>
                <t.Icon className="w-4 h-4 shrink-0" />{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {banner && (
              <div className="text-sm rounded-lg px-4 py-3"
                   style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
                {banner}
              </div>
            )}

            {/* TAB SESIONES */}
            {tab === 'sesiones' && (
              <div className="space-y-3">
                {sesiones.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: sub }}>No hay sesiones programadas.</p>
                )}
                {sesiones.map(s => (
                  <FilaSesion key={s.id} sesion={s} theme={theme} accionEnCurso={accionSesion}
                    onReprogramar={setSesionReprogramar}
                    onAsistencia={setSesionAsistencia}
                    onCerrar={setSesionCerrar}
                    onCambiarEstado={solicitarCambioEstado}
                    onEvaluacion={setSesionEvaluacion}
                  />
                ))}

                {/* Nueva sesión */}
                <div className="rounded-xl p-4 space-y-3 mt-2" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                  <p className="text-sm font-semibold" style={{ color: text }}>Nueva sesión</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: sub }}>Fecha y hora *</label>
                      <input type="datetime-local" value={sesionForm.fecha}
                        onChange={e => setSesionForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      <p className="text-xs mt-1" style={{ color: sub }}>Hora Colombia (UTC−5)</p>
                      {sesionForm.fecha && new Date(sesionForm.fecha) < new Date() && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#F59E0B' }}>
                          <AlertTriangle size={12} /> La fecha seleccionada es en el pasado.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: sub }}>Lugar</label>
                      <input type="text" placeholder="Ej: Sala de reuniones" value={sesionForm.lugar}
                        onChange={e => setSesionForm(f => ({ ...f, lugar: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                    </div>
                  </div>
                  <button onClick={crearSesion} disabled={loading}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#6366F1' }}>
                    {loading ? 'Guardando...' : '+ Programar sesión'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB INFO */}
            {tab === 'info' && (
              <div className="space-y-3">
                {[
                  { label: 'Objetivos', value: capacitacion.objetivos || 'Sin objetivos registrados.' },
                  { label: 'Duración',  value: `${capacitacion.duracion_horas} horas` },
                  { label: 'Estado',    value: esActiva ? 'Activa' : 'Suspendida', style: { color: esActiva ? '#22C55E' : '#CBD5E1', fontWeight: 600 } },
                ].map(({ label, value, style }) => (
                  <div key={label} className="rounded-lg p-3" style={{ backgroundColor: input }}>
                    <p className="text-xs mb-1" style={{ color: sub }}>{label}</p>
                    <p className="text-sm" style={{ color: text, ...style }}>{value}</p>
                  </div>
                ))}
                {capacitacion.areas?.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                    <p className="text-xs mb-2" style={{ color: sub }}>Áreas dirigidas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {capacitacion.areas.map(a => (
                        <span key={a.id} className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818CF8' }}>
                          {a.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB EDITAR */}
            {tab === 'editar' && (
              <div className="space-y-4">
                {bannerEdit.msg && (
                  <div className={`text-sm rounded-lg px-4 py-3 border ${bannerEdit.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {bannerEdit.msg}
                  </div>
                )}
                {[
                  { key: 'titulo', label: 'Título *', type: 'text' },
                  { key: 'duracion_horas', label: 'Duración (horas)', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>{label}</label>
                    <input type={type} min={type === 'number' ? 1 : undefined}
                      value={editForm[key]} onChange={e => setEdit(key, e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                      style={{ backgroundColor: input, color: text }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos</label>
                  <textarea rows={3} value={editForm.objetivos} onChange={e => setEdit('objetivos', e.target.value)}
                    placeholder="Describe los objetivos..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent resize-none"
                    style={{ backgroundColor: input, color: text }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
                    Áreas dirigidas {loadingAreas && <span className="opacity-50">(cargando…)</span>}
                  </label>
                  <SelectorAreas areas={areas} selected={editAreaIds} onChange={setEditAreaIds} darkMode={darkMode} />
                </div>
                <button onClick={guardarEdicion} disabled={loadingEdit}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mt-2"
                  style={{ backgroundColor: '#6366F1' }}>
                  {loadingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>

                <div className="pt-3 border-t" style={{ borderColor: border }}>
                  <button onClick={() => setConfirmEliminar(true)}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5"
                    style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Trash2 size={14} /> Eliminar capacitación
                  </button>
                  <p className="text-xs mt-1.5 text-center" style={{ color: sub }}>
                    Esta acción es permanente y elimina también sus sesiones.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {sesionReprogramar && (
        <ModalReprogramar darkMode={darkMode} sesion={sesionReprogramar}
          onClose={() => setSesionReprogramar(null)}
          onReprogramada={() => { cargarSesiones(); setSesionReprogramar(null) }} />
      )}
      {sesionCerrar && (
        <ModalCerrarSesion darkMode={darkMode} sesion={sesionCerrar} loading={accionSesion}
          onClose={() => setSesionCerrar(null)}
          onConfirmar={(estado) => cambiarEstadoSesion(sesionCerrar, estado)} />
      )}

      <ConfirmDialog
        open={!!confirmCancelar}
        title="¿Cancelar sesión?"
        message={confirmCancelar ? `Se cancelará la sesión del ${formatColombia(confirmCancelar.fecha)}. Podrás reabrirla más adelante si es necesario.` : ''}
        confirmLabel="Cancelar sesión"
        danger
        loading={accionSesion}
        onConfirm={async () => { await cambiarEstadoSesion(confirmCancelar, 'cancelada'); setConfirmCancelar(null) }}
        onCancel={() => setConfirmCancelar(null)}
      />

      <ConfirmDialog
        open={confirmSuspender}
        title="¿Suspender capacitación?"
        message="Los empleados asignados no podrán ver ni acceder a esta capacitación mientras esté suspendida. Podrás reactivarla en cualquier momento."
        confirmLabel="Suspender"
        danger
        loading={loadingToggle}
        onConfirm={() => { setConfirmSuspender(false); toggleActivo() }}
        onCancel={() => setConfirmSuspender(false)}
      />

      <ConfirmDialog
        open={confirmEliminar}
        title="¿Eliminar capacitación?"
        message="Esta acción eliminará la capacitación y todas sus sesiones de forma permanente. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
        onConfirm={eliminarCapacitacion}
        onCancel={() => setConfirmEliminar(false)}
      />
    </>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL (sin cambios)
══════════════════════════════════════════ */
export default function Capacitaciones() {
  const { darkMode } = useTheme()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'

  const [capacitaciones, setCapacitaciones] = useState([])
  const [cobertura, setCobertura]           = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(false)
  const [modalNuevo, setModalNuevo]         = useState(false)
  const [modalDetalle, setModalDetalle]     = useState(null)
  const [filtro, setFiltro]                 = useState('activas')
  const [searchParams, setSearchParams]     = useSearchParams()

  const cargar = async () => {
    setLoading(true)
    try {
      const { data } = await capacitacionesAPI.getAll()
      const arr = Array.isArray(data) ? data : data.items ?? data.capacitaciones ?? data.data ?? []
      setCapacitaciones(arr)
      setError(false)
    } catch (err) {
      setError(true)
    } finally { setLoading(false) }
    try {
      const { data } = await capacitacionesAPI.getCobertura()
      setCobertura(data)
    } catch { setCobertura(null) }
  }

  useEffect(() => { cargar() }, [])

  // Deep link desde notificaciones: /capacitaciones?capacitacion={id}
  useEffect(() => {
    const capId = searchParams.get('capacitacion')
    if (!capId || capacitaciones.length === 0) return
    const encontrada = capacitaciones.find(c => String(c.id) === capId)
    if (encontrada) setModalDetalle(encontrada)
    setSearchParams({})
  }, [capacitaciones, searchParams])

  const lista = useMemo(() => {
    if (filtro === 'activas')   return capacitaciones.filter(c => c.activo)
    if (filtro === 'inactivas') return capacitaciones.filter(c => !c.activo)
    return capacitaciones
  }, [capacitaciones, filtro])

  const { paginaItems: listaPagina, pagina, totalPaginas, setPagina } = usePaginacion(lista)

  const pct = cobertura?.porcentaje ?? 0

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Capacitaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {lista.length} {lista.length === 1 ? 'programa' : 'programas'}{' '}
            {filtro === 'activas' ? 'activos' : filtro === 'inactivas' ? 'inactivos' : 'en total'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
            {[{ key: 'activas', label: 'Activas' }, { key: 'inactivas', label: 'Inactivas' }, { key: 'todas', label: 'Todas' }].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className="px-3 py-1.5 text-xs font-medium transition"
                style={{ backgroundColor: filtro === f.key ? '#6366F1' : card, color: filtro === f.key ? '#fff' : sub }}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => setModalNuevo(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#6366F1' }}>
            <Plus size={16} /> Nueva Capacitación
          </button>
        </div>
      </div>

      {cobertura && (
        <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          <div>
            <p className="text-xs font-medium" style={{ color: sub }}>Cobertura del plan anual</p>
            <p className="text-2xl font-bold mt-1" style={{ color: text }}>{pct}%</p>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {cobertura.completadas ?? 0} de {cobertura.total ?? 0} capacitaciones con sesiones realizadas
            </p>
          </div>
          <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#6366F1' }} />
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm mb-3" style={{ color: sub }}>No se pudieron cargar las capacitaciones.</p>
          <button onClick={cargar}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#6366F1' }}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-12 gap-2" style={{ color: sub }}>
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Cargando capacitaciones…</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>
            {filtro === 'activas' ? 'No hay capacitaciones activas.' : filtro === 'inactivas' ? 'No hay capacitaciones inactivas.' : 'No hay capacitaciones registradas.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaPagina.map(c => (
            <div key={c.id} className="rounded-xl p-5 flex flex-col gap-3 transition"
                 style={{ backgroundColor: card, border: `1px solid ${border}`, opacity: c.activo ? 1 : 0.65 }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm leading-snug" style={{ color: text }}>{c.titulo}</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.activo ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: c.activo ? '#22C55E' : '#CBD5E1' }}>
                  {c.activo ? 'Activa' : 'Suspendida'}
                </span>
              </div>
              {c.objetivos && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{c.objetivos}</p>}
              {c.areas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.areas.slice(0, 3).map(a => (
                    <span key={a.id} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>{a.nombre}</span>
                  ))}
                  {c.areas.length > 3 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: sub }}>+{c.areas.length - 3} más</span>}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-1">
                <p className="text-xs flex items-center gap-1" style={{ color: sub }}><Clock size={11} />{c.duracion_horas}h</p>
                <button onClick={() => setModalDetalle(c)}
                        className="text-xs font-semibold rounded-lg px-3 py-1.5 transition hover:opacity-90"
                        style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}>
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>
        <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} darkMode={darkMode} />
        </>
      )}

      {modalNuevo && <ModalNuevaCapacitacion darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreada={cargar} />}
      {modalDetalle && <ModalDetalle darkMode={darkMode} capacitacion={modalDetalle} onClose={() => setModalDetalle(null)} onActualizada={cargar} />}
    </div>
  )
}