import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, X, ClipboardList } from 'lucide-react'
import { auditoriasAPI } from '../services/api'

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

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${colorClass}`}>{text?.replace(/_/g, ' ')}</span>
}

/* ══════════════════════════════════════════
   MODAL: NUEVA AUDITORÍA
══════════════════════════════════════════ */
function ModalNuevaAuditoria({ darkMode, onClose, onCreada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
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
      setBanner(err.response?.data?.detail || 'Error al crear la auditoría.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nueva Auditoría</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Fecha programada *</label>
            <input type="datetime-local" value={form.fecha_programada}
                   onChange={e => set('fecha_programada', e.target.value)}
                   className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores.fecha_programada ? 'border-red-500' : 'border-transparent'}`}
                   style={{ backgroundColor: input, color: text }} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos</label>
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
function ModalDetalle({ darkMode, auditoria, onClose, onActualizada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]             = useState('info')
  const [hallazgos, setHallazgos] = useState([])
  const [progreso, setProgreso]   = useState(null)
  const [banner, setBanner]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [estadoActual, setEstadoActual] = useState(auditoria.estado)  // ← aquí

  const [hallazgoForm, setHallazgoForm] = useState({
    descripcion: '', clasificacion: '', evidencia: '', recomendacion: ''
  })
  const [ncForm, setNcForm]   = useState({ descripcion: '', fecha_limite: '' })
  const [ncTarget, setNcTarget] = useState(null)

  useEffect(() => {
    Promise.all([
      auditoriasAPI.getHallazgos(auditoria.id),
      auditoriasAPI.getProgreso(auditoria.id),
    ]).then(([h, p]) => { setHallazgos(h.data); setProgreso(p.data) })
      .catch(console.error)
  }, [auditoria.id])

  const cambiarEstado = async (estado) => {
    try {
      await auditoriasAPI.cambiarEstado(auditoria.id, estado)
      setEstadoActual(estado)   // ← actualiza visualmente el modal al instante
      onActualizada()
      setBanner('')
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al cambiar estado.')
    }
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
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al guardar hallazgo.')
    } finally { setLoading(false) }
  }

  const guardarNC = async () => {
    if (!ncForm.descripcion || !ncForm.fecha_limite) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    setLoading(true)
    try {
      await auditoriasAPI.crearNC(ncTarget, {
        descripcion:  ncForm.descripcion,
        fecha_limite: new Date(ncForm.fecha_limite).toISOString(),
      })
      setNcTarget(null)
      setNcForm({ descripcion: '', fecha_limite: '' })
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al crear NC.')
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'info',      label: '📑 Información' },
    { id: 'hallazgos', label: '🔍 Hallazgos' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: text }}>
              Auditoría — {new Date(auditoria.fecha_programada).toLocaleDateString('es-CO')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {auditoria.objetivos || 'Sin objetivos registrados'}
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: border }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setBanner('') }}
                    className="px-4 py-3 text-sm font-medium border-b-2 transition"
                    style={{ borderColor: tab === t.id ? '#6366F1' : 'transparent', color: tab === t.id ? '#6366F1' : sub }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>}

          {/* ── TAB INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Fecha programada</p>
                  <p className="text-sm font-medium" style={{ color: text }}>
                    {new Date(auditoria.fecha_programada).toLocaleDateString('es-CO')}
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
                <p className="text-xs font-medium mb-2" style={{ color: sub }}>Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(e => (
                    <button key={e} onClick={() => cambiarEstado(e)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80"
                            style={{
                              backgroundColor: estadoActual === e ? '#6366F1' : input,
                              color: estadoActual === e ? '#fff' : text,
                              border: `1px solid ${border}`
                            }}>
                      {ESTADO_LABEL[e]}
                    </button>
                  ))}
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: text }}>{h.descripcion}</p>
                    <Badge text={h.clasificacion} colorClass={CLASIFICACION_COLOR[h.clasificacion] || 'bg-gray-500/20 text-gray-300'} />
                  </div>
                  {h.recomendacion && (
                    <p className="text-xs" style={{ color: sub }}>💡 {h.recomendacion}</p>
                  )}
                  {(h.clasificacion === 'no_conformidad_menor' || h.clasificacion === 'no_conformidad_mayor') && (
                    <button onClick={() => setNcTarget(h.id)}
                            className="text-xs font-semibold hover:underline"
                            style={{ color: '#6366F1' }}>
                      + Crear No Conformidad
                    </button>
                  )}
                </div>
              ))}

              {/* Form NC */}
              {ncTarget && (
                <div className="rounded-xl p-4 space-y-3 border-2" style={{ borderColor: '#6366F1', backgroundColor: input }}>
                  <p className="text-sm font-semibold" style={{ color: text }}>Nueva No Conformidad</p>
                  <textarea rows={2} placeholder="Descripción de la NC..." value={ncForm.descripcion}
                            onChange={e => setNcForm(f => ({ ...f, descripcion: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                            style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                  <input type="date" value={ncForm.fecha_limite}
                         onChange={e => setNcForm(f => ({ ...f, fecha_limite: e.target.value }))}
                         className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                         style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setNcTarget(null); setNcForm({ descripcion: '', fecha_limite: '' }) }}
                            className="flex-1 py-2 rounded-lg text-sm" style={{ color: sub }}>
                      Cancelar
                    </button>
                    <button onClick={guardarNC} disabled={loading}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#6366F1' }}>
                      {loading ? 'Guardando...' : 'Guardar NC'}
                    </button>
                  </div>
                </div>
              )}

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
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
export default function Auditorias() {
  const { darkMode } = useOutletContext()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'

  const [auditorias, setAuditorias]     = useState([])
  const [filtro, setFiltro]             = useState('todas')
  const [loading, setLoading]           = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  
  const cargar = () => {
    setLoading(true)
    auditoriasAPI.getAll()
      .then(r => setAuditorias(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const auditoriasFiltradas = filtro === 'todas'
    ? auditorias
    : auditorias.filter(a => a.estado === filtro)

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditoriasFiltradas.map(a => (
            <div key={a.id} className="rounded-xl p-5 flex flex-col gap-3"
                 style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm" style={{ color: text }}>
                  {new Date(a.fecha_programada).toLocaleDateString('es-CO')}
                </p>
                <Badge text={ESTADO_LABEL[a.estado] || a.estado}
                       colorClass={ESTADO_COLOR[a.estado] || 'bg-gray-500/20 text-gray-300'} />
              </div>
              {a.objetivos && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{a.objetivos}</p>
              )}
              <button onClick={() => setModalDetalle(a)}
                      className="text-xs font-semibold hover:underline text-left mt-auto"
                      style={{ color: '#6366F1' }}>
                Ver detalle →
              </button>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <ModalNuevaAuditoria darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreada={cargar} />
      )}
      {modalDetalle && (
        <ModalDetalle darkMode={darkMode} auditoria={modalDetalle}
                      onClose={() => setModalDetalle(null)} onActualizada={cargar} />
      )}
    </div>
  )
}