import { useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Plus, X, Download, AlertTriangle } from 'lucide-react'
import { incidentesAPI } from '../services/api'

/* ── Helpers ── */
const ESTADOS = ['todos', 'borrador', 'en_revision', 'abierto', 'en_investigacion', 'cerrado']
const ESTADO_LABEL = {
  borrador: 'Borrador', en_revision: 'En revisión',
  abierto: 'Abierto', en_investigacion: 'En investigación', cerrado: 'Cerrado'
}
const ESTADO_COLOR = {
  borrador:        'bg-gray-500/20 text-gray-300',
  en_revision:     'bg-blue-500/20 text-blue-300',
  abierto:         'bg-green-500/20 text-green-300',
  en_investigacion:'bg-orange-500/20 text-orange-300',
  cerrado:         'bg-red-500/20 text-red-300',
}
const SEVERIDAD_COLOR = {
  leve:     'bg-yellow-500/20 text-yellow-300',
  moderada: 'bg-orange-500/20 text-orange-300',
  grave:    'bg-red-500/20 text-red-300',
}
const TIPO_LABEL = {
  accidente: 'Accidente', incidente: 'Incidente',
  condicion_insegura: 'Condición Insegura'
}

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{text}</span>
}

/* ══════════════════════════════════════════
   MODAL: NUEVO REPORTE
══════════════════════════════════════════ */
function ModalNuevoReporte({ darkMode, onClose, onCreado }) {
  const bg   = darkMode ? '#0B0F19' : '#F9FAFB'
  const card = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm] = useState({
    tipo: '', severidad: '', fecha: '', lugar: '', descripcion: ''
  })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e = {}
    if (!form.tipo)        e.tipo        = true
    if (!form.severidad)   e.severidad   = true
    if (!form.fecha)       e.fecha       = true
    if (!form.lugar)       e.lugar       = true
    if (!form.descripcion) e.descripcion = true
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBanner('Por favor, diligencia todos los campos obligatorios para continuar.'); return }
    setBanner('')
    setLoading(true)
    try {
      await incidentesAPI.create({
        tipo: form.tipo, severidad: form.severidad,
        fecha: new Date(form.fecha).toISOString(),
        lugar: form.lugar, descripcion: form.descripcion,
      })
      onCreado()
      onClose()
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al crear el reporte.')
    } finally { setLoading(false) }
  }

  const inputClass = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nuevo Reporte</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {banner}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Tipo de reporte *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                      className={inputClass('tipo')} style={{ backgroundColor: input, color: text }}>
                <option value="">Seleccionar...</option>
                <option value="accidente">Accidente</option>
                <option value="incidente">Incidente</option>
                <option value="condicion_insegura">Condición Insegura</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Severidad *</label>
              <select value={form.severidad} onChange={e => set('severidad', e.target.value)}
                      className={inputClass('severidad')} style={{ backgroundColor: input, color: text }}>
                <option value="">Seleccionar...</option>
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="grave">Grave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Fecha y hora *</label>
            <input type="datetime-local" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                   className={inputClass('fecha')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Lugar *</label>
            <input type="text" placeholder="Área o zona exacta" value={form.lugar}
                   onChange={e => set('lugar', e.target.value)}
                   className={inputClass('lugar')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Descripción *</label>
            <textarea rows={3} placeholder="Documenta detalladamente el evento..." value={form.descripcion}
                      onChange={e => set('descripcion', e.target.value)}
                      className={inputClass('descripcion')} style={{ backgroundColor: input, color: text }} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Guardando...' : 'Guardar reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE DEL REPORTE
══════════════════════════════════════════ */
function ModalDetalle({ darkMode, reporte, onClose, onActualizado }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]             = useState('info')
  const [banner, setBanner]       = useState('')
  const [investigacion, setInv]   = useState({
    metodo_analisis: '', causas_inmediatas: '', causas_basicas: '',
    factores_contribuyentes: '', descripcion_evento: '', lecciones_aprendidas: ''
  })
  const [accion, setAccion] = useState({
    descripcion: '', prioridad: 'media', fecha_limite: ''
  })
  const [acciones, setAcciones]   = useState([])
  const [loadingFurat, setLFurat] = useState(false)

  const setI = (k, v) => setInv(f => ({ ...f, [k]: v }))
  const setA = (k, v) => setAccion(f => ({ ...f, [k]: v }))

  const cambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === 'cerrado') {
      if (!investigacion.metodo_analisis || !investigacion.causas_inmediatas || !investigacion.causas_basicas) {
        setBanner('No se puede cerrar el reporte si no hay una investigación de causas documentada.')
        setTab('investigacion')
        return
      }
    }
    setBanner('')
    try {
      await incidentesAPI.cambiarEstado(reporte.id, nuevoEstado)
      onActualizado()
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al cambiar estado.')
    }
  }

  const guardarInvestigacion = async () => {
    if (!investigacion.metodo_analisis || !investigacion.causas_inmediatas || !investigacion.causas_basicas) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    try {
      await incidentesAPI.crearInvestigacion(reporte.id, investigacion)
      setBanner('')
      alert('Investigación guardada correctamente.')
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al guardar investigación.')
    }
  }

  const guardarAccion = async () => {
    if (!accion.descripcion || !accion.fecha_limite) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setBanner('')
    try {
      await incidentesAPI.crearAccion(reporte.id, {
        descripcion: accion.descripcion,
        prioridad: accion.prioridad,
        fecha_limite: new Date(accion.fecha_limite).toISOString(),
      })
      setAcciones(a => [...a, { ...accion }])
      setAccion({ descripcion: '', prioridad: 'media', fecha_limite: '' })
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al guardar acción.')
    }
  }

  const descargarFurat = async () => {
    setLFurat(true)
    try {
      const res = await incidentesAPI.descargarFurat(reporte.id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `FURAT_${reporte.id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { setBanner('Error al descargar el FURAT.') }
    finally { setLFurat(false) }
  }

  const tabs = [
    { id: 'info', label: '📑 Información' },
    { id: 'investigacion', label: '🔍 Investigación' },
    { id: 'acciones', label: '📝 Acciones correctivas' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: text }}>
              {TIPO_LABEL[reporte.tipo] || reporte.tipo}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>{reporte.lugar} · {new Date(reporte.fecha).toLocaleDateString('es-CO')}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6" style={{ borderColor: border }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setBanner('') }}
                    className="px-4 py-3 text-sm font-medium border-b-2 transition"
                    style={{
                      borderColor: tab === t.id ? '#6366F1' : 'transparent',
                      color: tab === t.id ? '#6366F1' : sub
                    }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {banner}
            </div>
          )}

          {/* ── TAB INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Lugar</p>
                  <p className="text-sm font-medium" style={{ color: text }}>{reporte.lugar}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Fecha</p>
                  <p className="text-sm font-medium" style={{ color: text }}>
                    {new Date(reporte.fecha).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Descripción</p>
                <p className="text-sm" style={{ color: text }}>{reporte.descripcion}</p>
              </div>

              <div>
                <p className="text-xs font-medium mb-2" style={{ color: sub }}>Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {['borrador','en_revision','abierto','en_investigacion','cerrado'].map(e => (
                    <button key={e} onClick={() => cambiarEstado(e)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80"
                            style={{
                              backgroundColor: reporte.estado === e ? '#6366F1' : input,
                              color: reporte.estado === e ? '#fff' : text,
                              border: `1px solid ${border}`
                            }}>
                      {ESTADO_LABEL[e]}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={descargarFurat} disabled={loadingFurat}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white w-full justify-center disabled:opacity-50"
                      style={{ backgroundColor: '#6366F1' }}>
                <Download size={15} />
                {loadingFurat ? 'Descargando...' : 'Descargar FURAT (PDF)'}
              </button>
            </div>
          )}

          {/* ── TAB INVESTIGACIÓN ── */}
          {tab === 'investigacion' && (
            <div className="space-y-4">
              {[
                { k: 'metodo_analisis', label: 'Método de análisis *', type: 'select',
                  options: [['5_por_que','5 Por Qué'],['espina_pescado','Espina de Pescado'],['arbol_causas','Árbol de Causas']] },
                { k: 'descripcion_evento',        label: 'Descripción del evento',     type: 'textarea' },
                { k: 'causas_inmediatas',         label: 'Causas inmediatas *',        type: 'textarea' },
                { k: 'causas_basicas',            label: 'Causas básicas *',           type: 'textarea' },
                { k: 'factores_contribuyentes',   label: 'Factores contribuyentes',    type: 'textarea' },
                { k: 'lecciones_aprendidas',      label: 'Lecciones aprendidas',       type: 'textarea' },
              ].map(({ k, label, type, options }) => (
                <div key={k}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>{label}</label>
                  {type === 'select'
                    ? <select value={investigacion[k]} onChange={e => setI(k, e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}>
                        <option value="">Seleccionar...</option>
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    : <textarea rows={2} value={investigacion[k]} onChange={e => setI(k, e.target.value)}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                                style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                  }
                </div>
              ))}
              <button onClick={guardarInvestigacion}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: '#6366F1' }}>
                Guardar investigación
              </button>
            </div>
          )}

          {/* ── TAB ACCIONES ── */}
          {tab === 'acciones' && (
            <div className="space-y-4">
              {acciones.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: sub }}>
                  No hay acciones correctivas registradas.
                </p>
              )}
              {acciones.map((a, i) => (
                <div key={i} className="rounded-lg p-3 text-sm" style={{ backgroundColor: input, color: text }}>
                  <p className="font-medium">{a.descripcion}</p>
                  <p className="text-xs mt-1" style={{ color: sub }}>Prioridad: {a.prioridad} · Límite: {a.fecha_limite}</p>
                </div>
              ))}

              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                <p className="text-sm font-semibold" style={{ color: text }}>Nueva acción correctiva</p>
                <textarea rows={2} placeholder="Descripción de la acción..." value={accion.descripcion}
                          onChange={e => setA('descripcion', e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                          style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={accion.prioridad} onChange={e => setA('prioridad', e.target.value)}
                          className="rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                  <input type="date" value={accion.fecha_limite} onChange={e => setA('fecha_limite', e.target.value)}
                         className="rounded-lg px-3 py-2 text-sm outline-none"
                         style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAccion({ descripcion: '', prioridad: 'media', fecha_limite: '' })}
                          className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>
                    Cancelar
                  </button>
                  <button onClick={guardarAccion}
                          className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
                          style={{ backgroundColor: '#6366F1' }}>
                    Guardar acción
                  </button>
                </div>
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
export default function Incidentes() {
  const { darkMode } = useOutletContext()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'

  const [reportes, setReportes]         = useState([])
  const [filtro, setFiltro]             = useState('todos')
  const [loading, setLoading]           = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

useEffect(() => {
  if (searchParams.get('nuevo') === 'true') {
    setModalNuevo(true)
    setSearchParams({})
  }
}, [searchParams])

  const cargarReportes = () => {
    setLoading(true)
    incidentesAPI.getAll()
      .then(r => setReportes(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarReportes() }, [])

  const reportesFiltrados = filtro === 'todos'
    ? reportes
    : reportes.filter(r => r.estado === filtro)

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Reportes</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {reportes.length} {reportes.length === 1 ? 'reporte registrado' : 'reportes registrados'}
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#6366F1' }}>
          <Plus size={16} /> Nuevo Reporte
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setFiltro(e)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    backgroundColor: filtro === e ? '#6366F1' : card,
                    color: filtro === e ? '#fff' : sub,
                    border: `1px solid ${filtro === e ? '#6366F1' : border}`
                  }}>
            {e === 'todos' ? 'Todos' : ESTADO_LABEL[e]}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando reportes...</p>
      ) : reportesFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>No hay reportes en este estado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportesFiltrados.map(r => (
            <div key={r.id} className="rounded-xl p-5 flex flex-col gap-3"
                 style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm" style={{ color: text }}>
                  {TIPO_LABEL[r.tipo] || r.tipo}
                </p>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <Badge text={ESTADO_LABEL[r.estado] || r.estado} colorClass={ESTADO_COLOR[r.estado] || 'bg-gray-500/20 text-gray-300'} />
                  <Badge text={r.severidad} colorClass={SEVERIDAD_COLOR[r.severidad] || 'bg-gray-500/20 text-gray-300'} />
                </div>
              </div>

              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>
                {r.descripcion}
              </p>

              <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: border }}>
                <div className="text-xs" style={{ color: sub }}>
                  <span>{r.lugar}</span>
                  <span className="mx-1">·</span>
                  <span>{new Date(r.fecha).toLocaleDateString('es-CO')}</span>
                </div>
                <button onClick={() => setModalDetalle(r)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: '#6366F1' }}>
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <ModalNuevoReporte darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreado={cargarReportes} />
      )}
      {modalDetalle && (
        <ModalDetalle darkMode={darkMode} reporte={modalDetalle}
                      onClose={() => setModalDetalle(null)} onActualizado={cargarReportes} />
      )}
    </div>
  )
}