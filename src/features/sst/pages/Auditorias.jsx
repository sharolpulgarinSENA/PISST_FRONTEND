import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { Plus, X, ClipboardList, FileText, Search, Lightbulb, Pencil, Trash2 } from 'lucide-react'
import { auditoriasAPI, getErrorMessage } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { useModal } from '../../../hooks/useModal'
import { normFecha, fmtFecha } from '../../../utils/dates'
import { usePaginacion } from '../../../hooks/usePaginacion'
import Paginador from '../../../components/Paginador'
import ConfirmDialog from '../../../components/ConfirmDialog'

const ESTADOS = ['planificada', 'en_ejecucion', 'completada']
const ESTADO_COLOR = {
  planificada:  'bg-blue-500/20 text-blue-300',
  en_ejecucion: 'bg-yellow-500/20 text-yellow-300',
  completada:   'bg-green-500/20 text-green-300',
}
const ESTADO_LABEL = {
  planificada: 'Planificada', en_ejecucion: 'En ejecución', completada: 'Completada'
}
const CLASIFICACION_COLOR = {
  conformidad:             'bg-green-500/20 text-green-300',
  no_conformidad_menor:    'bg-yellow-500/20 text-yellow-300',
  no_conformidad_mayor:    'bg-red-500/20 text-red-300',
  observacion:             'bg-blue-500/20 text-blue-300',
}
const NC_ESTADO_COLOR = {
  abierta:    'bg-red-500/20 text-red-300',
  en_proceso: 'bg-yellow-500/20 text-yellow-300',
  cerrada:    'bg-green-500/20 text-green-300',
}
const NC_ESTADO_LABEL = {
  abierta: 'Abierta', en_proceso: 'En proceso', cerrada: 'Cerrada',
}

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${colorClass}`}>{text?.replace(/_/g, ' ')}</span>
}

/* ══════════════════════════════════════════
   MODAL: NUEVA AUDITORÍA
══════════════════════════════════════════ */
function ModalNuevaAuditoria({ darkMode, onClose, onCreada }) {
  const dialogRef = useModal(onClose)
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]       = useState({ objetivos: '', fecha_programada: '' })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.fecha_programada) {
      setErrores({ fecha_programada: true })
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    setLoading(true)
    try {
      await auditoriasAPI.crear({
        objetivos: form.objetivos || undefined,
        fecha_programada: new Date(form.fecha_programada).toISOString(),
      })
      onCreada()
      onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al crear la auditoría.'))
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-nueva-auditoria-title"
           className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 id="modal-nueva-auditoria-title" className="font-bold text-lg" style={{ color: text }}>Nueva Auditoría</h2>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="text-sm rounded-lg px-4 py-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {banner}
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Fecha programada *</label>
            <input type="datetime-local" value={form.fecha_programada}
                   onChange={e => set('fecha_programada', e.target.value)}
                   className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores.fecha_programada ? 'border-red-500' : 'border-transparent'}`}
                   style={{ backgroundColor: input, color: text }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos (opcional)</label>
            <textarea rows={3} placeholder="Describe los objetivos de la auditoría..." value={form.objetivos}
                      onChange={e => set('objetivos', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent resize-none"
                      style={{ backgroundColor: input, color: text }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Creando...' : 'Crear auditoría'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE AUDITORÍA
══════════════════════════════════════════ */
const FOCUSABLE_SEL_AD = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function ModalDetalle({ darkMode, auditoria, initialTab = 'info', onClose, onActualizada }) {
  const { user } = useAuth()
  const dialogRef = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const el = dialogRef.current
    el?.querySelectorAll(FOCUSABLE_SEL_AD)?.[0]?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const els = [...(el?.querySelectorAll(FOCUSABLE_SEL_AD) ?? [])]
      if (!els.length) return
      if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els.at(-1).focus() }
      else if (!e.shiftKey && document.activeElement === els.at(-1)) { e.preventDefault(); els[0].focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [])
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]             = useState(initialTab)
  const [hallazgos, setHallazgos] = useState([])
  const [progreso, setProgreso]   = useState(null)
  const [banner, setBanner]       = useState('')
  const [bannerOk, setBannerOk]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [estadoActual, setEstadoActual] = useState(auditoria.estado)

  const [hallazgoForm, setHallazgoForm] = useState({
    descripcion: '', clasificacion: '', evidencia: '', recomendacion: ''
  })
  const [ncForm, setNcForm]     = useState({ descripcion: '', fecha_limite: '' })
  const [ncTarget, setNcTarget] = useState(null)
  const [editingNcId, setEditingNcId]     = useState(null)
  const [editNcForm, setEditNcForm]       = useState({ estado: '', evidencia_cierre: '', descripcion: '', fecha_limite: '' })

  const [editingHallazgoId, setEditingHallazgoId]   = useState(null)
  const [editHallazgoForm, setEditHallazgoForm]     = useState({ descripcion: '', clasificacion: '', evidencia: '', recomendacion: '' })
  const [confirmEliminarHallazgo, setConfirmEliminarHallazgo] = useState(null)
  const [confirmCompletar, setConfirmCompletar]     = useState(false)

  useEffect(() => {
    Promise.all([
      auditoriasAPI.getHallazgos(auditoria.id),
      auditoriasAPI.getProgreso(auditoria.id),
    ]).then(([h, p]) => { setHallazgos(h.data); setProgreso(p.data) })
      .catch(() => {})
  }, [auditoria.id])

  const ncsAbiertas = hallazgos.reduce(
    (acc, h) => acc + (h.no_conformidades?.filter(nc => (nc.estado || 'abierta') === 'abierta').length || 0),
    0
  )

  const showOk = (msg) => {
    setBanner('')
    setBannerOk(msg)
    setTimeout(() => setBannerOk(''), 3000)
  }

  const ejecutarCambioEstado = async (estado) => {
    try {
      await auditoriasAPI.cambiarEstado(auditoria.id, estado)
      setEstadoActual(estado)   // ← actualiza visualmente el modal al instante
      onActualizada()
      setBanner('')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al cambiar estado.'))
    }
  }

  const cambiarEstado = (estado) => {
    if (estado === 'completada') {
      setConfirmCompletar(true)
      return
    }
    ejecutarCambioEstado(estado)
  }

  const guardarHallazgo = async () => {
    if (!hallazgoForm.descripcion || !hallazgoForm.clasificacion) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    setLoading(true)
    try {
      await auditoriasAPI.crearHallazgo(auditoria.id, {
        descripcion:    hallazgoForm.descripcion,
        clasificacion:  hallazgoForm.clasificacion,
        evidencia:      hallazgoForm.evidencia || undefined,
        recomendacion:  hallazgoForm.recomendacion || undefined,
      })
      const r = await auditoriasAPI.getHallazgos(auditoria.id)
      setHallazgos(r.data)
      setHallazgoForm({ descripcion: '', clasificacion: '', evidencia: '', recomendacion: '' })
      showOk('Hallazgo registrado correctamente.')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al guardar hallazgo.'))
    } finally { setLoading(false) }
  }

  const recargarHallazgos = async () => {
    const r = await auditoriasAPI.getHallazgos(auditoria.id)
    setHallazgos(r.data)
  }

  const guardarNC = async () => {
    if (!ncForm.descripcion || !ncForm.fecha_limite) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    const responsable_id = user?.id
    if (!responsable_id) { setBanner('No se pudo obtener el usuario. Intenta recargar la sesión.'); return }
    setBanner('')
    setLoading(true)
    try {
      await auditoriasAPI.crearNC(ncTarget, {
        descripcion:    ncForm.descripcion,
        fecha_limite:   ncForm.fecha_limite + 'T00:00:00-05:00',
        responsable_id,
      })
      await recargarHallazgos()
      setNcTarget(null)
      setNcForm({ descripcion: '', fecha_limite: '' })
      showOk('No conformidad creada correctamente.')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al crear NC.'))
    } finally { setLoading(false) }
  }

  const guardarEdicionNC = async () => {
    setLoading(true)
    try {
      await auditoriasAPI.actualizarNC(editingNcId, {
        estado:           editNcForm.estado           || undefined,
        evidencia_cierre: editNcForm.evidencia_cierre || undefined,
        descripcion:      editNcForm.descripcion      || undefined,
        fecha_limite:     editNcForm.fecha_limite      ? editNcForm.fecha_limite + 'T00:00:00-05:00' : undefined,
      })
      await recargarHallazgos()
      setEditingNcId(null)
      showOk('No conformidad actualizada correctamente.')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al actualizar NC.'))
    } finally { setLoading(false) }
  }

  const guardarEdicionHallazgo = async () => {
    if (!editHallazgoForm.descripcion || !editHallazgoForm.clasificacion) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    setLoading(true)
    try {
      await auditoriasAPI.actualizarHallazgo(editingHallazgoId, {
        descripcion:   editHallazgoForm.descripcion,
        clasificacion: editHallazgoForm.clasificacion,
        evidencia:     editHallazgoForm.evidencia || undefined,
        recomendacion: editHallazgoForm.recomendacion || undefined,
      })
      await recargarHallazgos()
      setEditingHallazgoId(null)
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al actualizar hallazgo.'))
    } finally { setLoading(false) }
  }

  const eliminarHallazgo = async (hallazgoId) => {
    setLoading(true)
    try {
      await auditoriasAPI.eliminarHallazgo(hallazgoId)
      await recargarHallazgos()
      setBanner('')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al eliminar hallazgo.'))
    } finally {
      setLoading(false)
      setConfirmEliminarHallazgo(null)
    }
  }

  const tabs = [
    { id: 'info',      label: 'Información', Icon: FileText },
    { id: 'hallazgos', label: 'Hallazgos',   Icon: Search   },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-detalle-auditoria-title"
           className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 id="modal-detalle-auditoria-title" className="font-bold text-lg" style={{ color: text }}>
              Auditoría — {fmtFecha(auditoria.fecha_programada)}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {auditoria.objetivos || 'Sin objetivos registrados'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: border }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setBanner('') }}
                    className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition"
                    style={{ borderColor: tab === t.id ? '#6366F1' : 'transparent', color: tab === t.id ? '#6366F1' : sub }}>
              <t.Icon className="w-4 h-4 shrink-0" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {banner && (
            <div className="text-sm rounded-lg px-4 py-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {banner}
            </div>
          )}
          {bannerOk && (
            <div className="text-sm rounded-lg px-4 py-3"
                 style={{ backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${darkMode ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, color: darkMode ? '#86EFAC' : '#15803D' }}>
              {bannerOk}
            </div>
          )}

          {/* ── TAB INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Fecha programada</p>
                  <p className="text-sm font-medium" style={{ color: text }}>
                    {fmtFecha(auditoria.fecha_programada)}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Estado actual</p>
                  <Badge text={ESTADO_LABEL[estadoActual] || estadoActual}
                         colorClass={ESTADO_COLOR[estadoActual] || 'bg-gray-500/20 text-gray-300'} />
                </div>
              </div>

              {progreso && (
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-2" style={{ color: sub }}>
                    Progreso NC: {progreso.completadas}/{progreso.total} cerradas
                  </p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#374151' }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${progreso.porcentaje || 0}%`, backgroundColor: '#6366F1' }} />
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium mb-3" style={{ color: sub }}>Avanzar estado</p>
                <div className="flex items-center gap-1">
                  {ESTADOS.map((e, idx) => {
                    const currentIdx = ESTADOS.indexOf(estadoActual)
                    const isCurrent  = estadoActual === e
                    const isDone     = idx < currentIdx
                    const isNext     = idx === currentIdx + 1
                    return (
                      <div key={e} className="flex items-center" style={{ flex: idx < ESTADOS.length - 1 ? '1' : 'none' }}>
                        <button
                          onClick={() => cambiarEstado(e)}
                          disabled={isCurrent || idx < currentIdx}
                          title={isCurrent ? 'Estado actual' : isDone ? 'Ya completado' : `Avanzar a ${ESTADO_LABEL[e]}`}
                          className="flex flex-col items-center gap-1 disabled:cursor-default transition"
                          style={{ opacity: isDone ? 0.5 : 1 }}
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                               style={{
                                 backgroundColor: isCurrent ? '#6366F1' : isDone ? '#22C55E' : isNext ? darkMode ? '#374151' : '#E5E7EB' : darkMode ? '#1F2937' : '#F3F4F6',
                                 color: isCurrent || isDone ? '#fff' : sub,
                                 border: isNext ? `2px dashed #6366F1` : 'none',
                               }}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: isCurrent ? '#6366F1' : sub, fontWeight: isCurrent ? 600 : 400 }}>
                            {ESTADO_LABEL[e]}
                          </span>
                        </button>
                        {idx < ESTADOS.length - 1 && (
                          <div className="flex-1 h-px mx-1 mt-[-10px]"
                               style={{ backgroundColor: isDone ? '#22C55E' : darkMode ? '#374151' : '#E5E7EB' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB HALLAZGOS ── */}
          {tab === 'hallazgos' && (
            <div className="space-y-4">
              {hallazgos.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: sub }}>No hay hallazgos registrados.</p>
              )}
              {hallazgos.map(h => (
                <div key={h.id} className="rounded-lg p-4 space-y-2"
                     style={{ backgroundColor: input }}>
                  {editingHallazgoId === h.id ? (
                    <div className="space-y-2">
                      <textarea rows={2} placeholder="Describe el hallazgo..." value={editHallazgoForm.descripcion}
                                onChange={e => setEditHallazgoForm(f => ({ ...f, descripcion: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                                style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      <select value={editHallazgoForm.clasificacion}
                              onChange={e => setEditHallazgoForm(f => ({ ...f, clasificacion: e.target.value }))}
                              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                              style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                        <option value="">Clasificación...</option>
                        <option value="conformidad">Conformidad</option>
                        <option value="no_conformidad_menor">No conformidad menor</option>
                        <option value="no_conformidad_mayor">No conformidad mayor</option>
                        <option value="observacion">Observación</option>
                      </select>
                      <input type="text" placeholder="Evidencia (opcional)" value={editHallazgoForm.evidencia}
                             onChange={e => setEditHallazgoForm(f => ({ ...f, evidencia: e.target.value }))}
                             className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                             style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      <input type="text" placeholder="Recomendación (opcional)" value={editHallazgoForm.recomendacion}
                             onChange={e => setEditHallazgoForm(f => ({ ...f, recomendacion: e.target.value }))}
                             className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                             style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      <div className="flex gap-2">
                        <button onClick={guardarEdicionHallazgo} disabled={loading}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: '#6366F1' }}>
                          {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingHallazgoId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs" style={{ color: sub }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                  <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: text }}>{h.descripcion}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge text={h.clasificacion} colorClass={CLASIFICACION_COLOR[h.clasificacion] || 'bg-gray-500/20 text-gray-300'} />
                      <button
                        onClick={() => { setEditingHallazgoId(h.id); setEditHallazgoForm({ descripcion: h.descripcion || '', clasificacion: h.clasificacion || '', evidencia: h.evidencia || '', recomendacion: h.recomendacion || '' }) }}
                        className="p-1.5 rounded-lg hover:opacity-70 transition"
                        style={{ backgroundColor: card, border: `1px solid ${border}` }}
                        title="Editar hallazgo" aria-label="Editar hallazgo"
                      >
                        <Pencil size={12} style={{ color: sub }} />
                      </button>
                      <button
                        onClick={() => setConfirmEliminarHallazgo(h.id)}
                        className="p-1.5 rounded-lg hover:opacity-70 transition"
                        style={{ backgroundColor: card, border: `1px solid ${border}` }}
                        title="Eliminar hallazgo" aria-label="Eliminar hallazgo"
                      >
                        <Trash2 size={12} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                  {h.recomendacion && (
                    <p className="flex items-center gap-1 text-xs" style={{ color: sub }}>
                    <Lightbulb className="w-3 h-3 shrink-0" />{h.recomendacion}
                  </p>
                  )}
                  </>
                  )}

                  {/* NCs existentes del hallazgo */}
                  {editingHallazgoId !== h.id && h.no_conformidades?.length > 0 && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2" style={{ borderColor: '#6366F1' }}>
                      {h.no_conformidades.map(nc => (
                        <div key={nc.id} className="rounded-lg p-3"
                             style={{ backgroundColor: card, border: `1px solid ${border}` }}>
                          {editingNcId === nc.id ? (
                            <div className="space-y-2">
                              <textarea rows={2} placeholder="Descripción de la NC..."
                                        value={editNcForm.descripcion}
                                        onChange={e => setEditNcForm(f => ({ ...f, descripcion: e.target.value }))}
                                        className="w-full rounded-lg px-3 py-1.5 text-xs outline-none resize-none"
                                        style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs mb-0.5 block" style={{ color: sub }}>Fecha límite</label>
                                  <input type="date" value={editNcForm.fecha_limite}
                                         onChange={e => setEditNcForm(f => ({ ...f, fecha_limite: e.target.value }))}
                                         className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                                         style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                                </div>
                                <div>
                                  <label className="text-xs mb-0.5 block" style={{ color: sub }}>Estado</label>
                                  <select value={editNcForm.estado}
                                          onChange={e => setEditNcForm(f => ({ ...f, estado: e.target.value }))}
                                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                                          style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}>
                                    <option value="">Sin cambio</option>
                                    <option value="abierta">Abierta</option>
                                    <option value="en_proceso">En proceso</option>
                                    <option value="cerrada">Cerrada</option>
                                  </select>
                                </div>
                              </div>
                              <input type="text" placeholder="Evidencia de cierre (opcional)"
                                     value={editNcForm.evidencia_cierre}
                                     onChange={e => setEditNcForm(f => ({ ...f, evidencia_cierre: e.target.value }))}
                                     className="w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                                     style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                              <div className="flex gap-2">
                                <button onClick={guardarEdicionNC} disabled={loading}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                                        style={{ backgroundColor: '#6366F1' }}>
                                  {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button onClick={() => setEditingNcId(null)}
                                        className="px-3 py-1.5 rounded-lg text-xs" style={{ color: sub }}>
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium" style={{ color: text }}>{nc.descripcion}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge
                                    text={NC_ESTADO_LABEL[nc.estado] || nc.estado || 'Abierta'}
                                    colorClass={NC_ESTADO_COLOR[nc.estado] || NC_ESTADO_COLOR.abierta}
                                  />
                                  <span className="text-xs" style={{ color: sub }}>
                                    Límite: {fmtFecha(nc.fecha_limite, { dateStyle: 'short' })}
                                  </span>
                                </div>
                                {nc.evidencia_cierre && (
                                  <p className="text-xs mt-1 truncate" style={{ color: sub }}>
                                    Evidencia: {nc.evidencia_cierre}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => { setEditingNcId(nc.id); setEditNcForm({ estado: nc.estado || '', evidencia_cierre: nc.evidencia_cierre || '', descripcion: nc.descripcion || '', fecha_limite: nc.fecha_limite ? nc.fecha_limite.split('T')[0] : '' }) }}
                                className="p-1.5 rounded-lg shrink-0 hover:opacity-70 transition"
                                style={{ backgroundColor: card, border: `1px solid ${border}` }}
                                title="Editar NC"
                              >
                                <Pencil size={12} style={{ color: sub }} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {editingHallazgoId !== h.id && (h.clasificacion === 'no_conformidad_menor' || h.clasificacion === 'no_conformidad_mayor') && (
                    ncTarget === h.id ? (
                      <div className="rounded-xl p-3 space-y-2 border-2 mt-1" style={{ borderColor: '#6366F1', backgroundColor: card }}>
                        <p className="text-xs font-semibold" style={{ color: text }}>Nueva No Conformidad</p>
                        <textarea rows={2} placeholder="Descripción de la NC..." value={ncForm.descripcion}
                                  onChange={e => setNcForm(f => ({ ...f, descripcion: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                                  style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                        <input type="date" value={ncForm.fecha_limite}
                               onChange={e => setNcForm(f => ({ ...f, fecha_limite: e.target.value }))}
                               className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                               style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                        <div className="flex gap-2">
                          <button onClick={() => { setNcTarget(null); setNcForm({ descripcion: '', fecha_limite: '' }) }}
                                  className="flex-1 py-1.5 rounded-lg text-xs" style={{ color: sub }}>
                            Cancelar
                          </button>
                          <button onClick={guardarNC} disabled={loading}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                                  style={{ backgroundColor: '#6366F1' }}>
                            {loading ? 'Guardando...' : 'Guardar NC'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setNcTarget(h.id); setEditingNcId(null) }}
                              className="text-xs font-semibold hover:underline"
                              style={{ color: '#6366F1' }}>
                        + Crear No Conformidad
                      </button>
                    )
                  )}
                </div>
              ))}

              {/* Nuevo hallazgo */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                <p className="text-sm font-semibold" style={{ color: text }}>Nuevo hallazgo</p>
                <textarea rows={2} placeholder="Describe el hallazgo..." value={hallazgoForm.descripcion}
                          onChange={e => setHallazgoForm(f => ({ ...f, descripcion: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                          style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                <select value={hallazgoForm.clasificacion}
                        onChange={e => setHallazgoForm(f => ({ ...f, clasificacion: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                  <option value="">Clasificación...</option>
                  <option value="conformidad">Conformidad</option>
                  <option value="no_conformidad_menor">No conformidad menor</option>
                  <option value="no_conformidad_mayor">No conformidad mayor</option>
                  <option value="observacion">Observación</option>
                </select>
                <input type="text" placeholder="Recomendación (opcional)" value={hallazgoForm.recomendacion}
                       onChange={e => setHallazgoForm(f => ({ ...f, recomendacion: e.target.value }))}
                       className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                       style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                <button onClick={guardarHallazgo} disabled={loading}
                        className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#6366F1' }}>
                  {loading ? 'Guardando...' : '+ Registrar hallazgo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCompletar}
        title="¿Marcar auditoría como completada?"
        message={
          ncsAbiertas > 0
            ? `Hay ${ncsAbiertas} no conformidad${ncsAbiertas === 1 ? '' : 'es'} abierta${ncsAbiertas === 1 ? '' : 's'}. ¿Marcar como completada de todas formas?`
            : 'Esta acción documenta el cierre del ciclo de auditoría. ¿Deseas continuar?'
        }
        confirmLabel="Marcar como completada"
        danger={ncsAbiertas > 0}
        onConfirm={() => { setConfirmCompletar(false); ejecutarCambioEstado('completada') }}
        onCancel={() => setConfirmCompletar(false)}
      />

      <ConfirmDialog
        open={!!confirmEliminarHallazgo}
        title="¿Eliminar hallazgo?"
        message="Esta acción eliminará el hallazgo y sus no conformidades asociadas. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={loading}
        onConfirm={() => eliminarHallazgo(confirmEliminarHallazgo)}
        onCancel={() => setConfirmEliminarHallazgo(null)}
      />
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
export default function Auditorias() {
  const { darkMode } = useTheme()
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'

  const [auditorias, setAuditorias]     = useState([])
  const [progresos, setProgresos]       = useState({})
  const [filtro, setFiltro]             = useState('todas')
  const [loading, setLoading]           = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalTab, setModalTab]         = useState('info')
  const [searchParams, setSearchParams] = useSearchParams()

  const cargar = () => {
    setLoading(true)
    auditoriasAPI.getAll()
      .then(async r => {
        const lista = r.data
        setAuditorias(lista)
        const resultados = await Promise.allSettled(
          lista.map(a => auditoriasAPI.getProgreso(a.id))
        )
        const map = {}
        resultados.forEach((res, i) => {
          if (res.status === 'fulfilled') map[lista[i].id] = res.value.data
        })
        setProgresos(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  // Deep link desde notificaciones: /auditorias?auditoria={id}&hallazgo=1
  useEffect(() => {
    const auditoriaId = searchParams.get('auditoria')
    if (!auditoriaId || auditorias.length === 0) return
    const encontrada = auditorias.find(a => String(a.id) === auditoriaId)
    if (encontrada) {
      setModalTab(searchParams.get('hallazgo') ? 'hallazgos' : 'info')
      setModalDetalle(encontrada)
    }
    setSearchParams({})
  }, [auditorias, searchParams])

  const auditoriasFiltradas = filtro === 'todas'
    ? auditorias
    : auditorias.filter(a => a.estado === filtro)

  const { paginaItems: auditoriasPagina, pagina, totalPaginas, setPagina } = usePaginacion(auditoriasFiltradas)

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ background: 'transparent' }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Auditorías</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {auditorias.length} {auditorias.length === 1 ? 'auditoría registrada' : 'auditorías registradas'}
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#6366F1' }}>
          <Plus size={16} /> Nueva Auditoría
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['todas', ...ESTADOS].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition"
                  style={{
                    backgroundColor: filtro === f ? '#6366F1' : card,
                    color: filtro === f ? '#fff' : sub,
                    border: `1px solid ${filtro === f ? '#6366F1' : border}`
                  }}>
            {f === 'todas' ? 'Todas' : ESTADO_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando auditorías...</p>
      ) : auditoriasFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>No hay auditorías en este estado.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditoriasPagina.map(a => (
            <div key={a.id} className="rounded-xl p-5 flex flex-col gap-3"
                 style={{
                   backgroundColor: card, border: `1px solid ${border}`,
                   boxShadow: darkMode ? '0 8px 24px -4px rgba(255,255,255,0.08)' : '0 8px 24px -4px rgba(15,23,42,0.14)',
                 }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm" style={{ color: text }}>
                  {fmtFecha(a.fecha_programada)}
                </p>
                <Badge text={ESTADO_LABEL[a.estado] || a.estado}
                       colorClass={ESTADO_COLOR[a.estado] || 'bg-gray-500/20 text-gray-300'} />
              </div>
              {a.objetivos && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{a.objetivos}</p>
              )}
              {progresos[a.id] && progresos[a.id].total > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: sub }}>
                      NCs: {progresos[a.id].completadas}/{progresos[a.id].total} cerradas
                    </span>
                    {(a.nc_abiertas ?? 0) > 0 && (
                      <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                        {a.nc_abiertas} abierta{a.nc_abiertas === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden"
                       style={{ backgroundColor: darkMode ? '#374151' : '#E5E7EB' }}>
                    <div className="h-full rounded-full transition-all"
                         style={{
                           width: `${progresos[a.id].porcentaje || 0}%`,
                           backgroundColor: progresos[a.id].porcentaje === 100 ? '#22C55E' : '#6366F1',
                         }} />
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-auto pt-1">
                <button onClick={() => setModalDetalle(a)}
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

      {modalNuevo && (
        <ModalNuevaAuditoria darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreada={cargar} />
      )}
      {modalDetalle && (
        <ModalDetalle darkMode={darkMode} auditoria={modalDetalle} initialTab={modalTab}
                      onClose={() => setModalDetalle(null)} onActualizada={cargar} />
      )}
    </div>
  )
}