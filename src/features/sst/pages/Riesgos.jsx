import { useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Plus, X, ShieldAlert, ChevronDown, ChevronUp, BarChart2, Shield, Users } from 'lucide-react'
import { riesgosAPI, getErrorMessage } from '../../../services/api'

const TIPOS_PELIGRO = [
  'fisico', 'quimico', 'biologico', 'ergonomico',
  'psicosocial', 'mecanico', 'electrico', 'locativo', 'fenomeno_natural'
]
const TIPOS_CONTROL = ['eliminacion', 'sustitucion', 'ingenieria', 'administrativo', 'epp']

const ESTADOS_CONTROL = {
  planificada:  'Planificada',
  en_ejecucion: 'En ejecución',
  completada:   'Completada',
}

const NIVEL_COLOR = {
  bajo:     'bg-green-500/20 text-green-300',
  medio:    'bg-yellow-500/20 text-yellow-300',
  alto:     'bg-orange-500/20 text-orange-300',
  critico:  'bg-red-500/20 text-red-300',
}

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${colorClass}`}>{text}</span>
}

/* ══════════════════════════════════════════
   MODAL: NUEVO PELIGRO
══════════════════════════════════════════ */
function ModalNuevoPeligro({ darkMode, onClose, onCreado }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]       = useState({ descripcion: '', tipo: '', actividad: '', trabajadores_expuestos: 0 })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e = {}
    if (!form.descripcion) e.descripcion = true
    if (!form.tipo)        e.tipo        = true
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBanner('Por favor, diligencia todos los campos obligatorios para continuar.'); return }
    setBanner('')
    setLoading(true)
    try {
      await riesgosAPI.crearPeligro({
        descripcion: form.descripcion,
        tipo: form.tipo,
        actividad: form.actividad || undefined,
        trabajadores_expuestos: Number(form.trabajadores_expuestos),
      })
      onCreado()
      onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al crear el peligro.'))
    } finally { setLoading(false) }
  }

  const inputClass = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nuevo Peligro</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Descripción del peligro *</label>
            <textarea rows={2} placeholder="Describe el peligro identificado..." value={form.descripcion}
                      onChange={e => set('descripcion', e.target.value)}
                      className={inputClass('descripcion')} style={{ backgroundColor: input, color: text }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                      className={inputClass('tipo')} style={{ backgroundColor: input, color: text }}>
                <option value="">Seleccionar...</option>
                {TIPOS_PELIGRO.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Trabajadores expuestos</label>
              <input type="number" min={0} value={form.trabajadores_expuestos}
                     onChange={e => set('trabajadores_expuestos', e.target.value)}
                     className={inputClass('trabajadores_expuestos')} style={{ backgroundColor: input, color: text }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Actividad</label>
            <input type="text" placeholder="Actividad relacionada" value={form.actividad}
                   onChange={e => set('actividad', e.target.value)}
                   className={inputClass('actividad')} style={{ backgroundColor: input, color: text }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Guardando...' : 'Guardar peligro'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE PELIGRO
══════════════════════════════════════════ */
function ModalDetalle({ darkMode, peligro, initialTab = 'evaluacion', onClose, onRefresh }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]       = useState(initialTab)
  const [detalle, setDetalle] = useState(null)
  const [banner, setBanner]   = useState('')
  const [evalForm, setEvalForm] = useState({ probabilidad: 1, severidad: 1, es_residual: false })
  const [controlForm, setControlForm] = useState({ descripcion: '', tipo: '', fecha_limite: '' })
  const [loading, setLoading] = useState(false)
  const [editingControlId, setEditingControlId] = useState(null)
  const [editControlForm, setEditControlForm] = useState({ descripcion: '', estado: '', evidencia: '' })

  useEffect(() => {
    riesgosAPI.getPeligro(peligro.id)
      .then(r => setDetalle(r.data))
      .catch(console.error)
  }, [peligro.id])

  const nivelRiesgo = evalForm.probabilidad * evalForm.severidad
  const nivelLabel = nivelRiesgo <= 4 ? 'bajo' : nivelRiesgo <= 9 ? 'medio' : nivelRiesgo <= 16 ? 'alto' : 'critico'

  const guardarEvaluacion = async () => {
    setLoading(true)
    try {
      await riesgosAPI.evaluar(peligro.id, {
        probabilidad: Number(evalForm.probabilidad),
        severidad: Number(evalForm.severidad),
        es_residual: evalForm.es_residual,
      })
      const r = await riesgosAPI.getPeligro(peligro.id)
      setDetalle(r.data)
      setBanner('')
      onRefresh()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al guardar evaluación.'))
    } finally { setLoading(false) }
  }

  const iniciarEdicionControl = (m) => {
    setEditingControlId(m.id)
    setEditControlForm({ descripcion: m.descripcion, estado: m.estado || '', evidencia: m.evidencia || '' })
    setBanner('')
  }

  const guardarEdicionControl = async () => {
    setLoading(true)
    try {
      await riesgosAPI.actualizarControl(editingControlId, {
        descripcion: editControlForm.descripcion || undefined,
        estado:      editControlForm.estado      || undefined,
        evidencia:   editControlForm.evidencia   || undefined,
      })
      const r = await riesgosAPI.getPeligro(peligro.id)
      setDetalle(r.data)
      setEditingControlId(null)
      setBanner('')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al actualizar el control.'))
    } finally { setLoading(false) }
  }

  const guardarControl = async () => {
    if (!controlForm.descripcion || !controlForm.tipo) {
      setBanner('Por favor, diligencia todos los campos obligatorios para continuar.')
      return
    }
    setLoading(true)
    try {
      await riesgosAPI.crearControl(peligro.id, {
        descripcion: controlForm.descripcion,
        tipo: controlForm.tipo,
        fecha_limite: controlForm.fecha_limite ? new Date(controlForm.fecha_limite).toISOString() : undefined,
      })
      const r = await riesgosAPI.getPeligro(peligro.id)
      setDetalle(r.data)
      setControlForm({ descripcion: '', tipo: '', fecha_limite: '' })
      setBanner('')
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al guardar control.'))
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'evaluacion', label: 'Evaluación', Icon: BarChart2 },
    { id: 'controles',  label: 'Controles',  Icon: Shield    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: text }}>{peligro.descripcion}</h2>
            <p className="text-xs mt-0.5 capitalize" style={{ color: sub }}>
              Tipo: {peligro.tipo} · {peligro.trabajadores_expuestos} trabajadores expuestos
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
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
          {banner && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>}

          {/* ── TAB EVALUACIÓN ── */}
          {tab === 'evaluacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: sub }}>
                    Probabilidad: {evalForm.probabilidad}
                  </label>
                  <input type="range" min={1} max={5} value={evalForm.probabilidad}
                         onChange={e => setEvalForm(f => ({ ...f, probabilidad: Number(e.target.value) }))}
                         className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-xs mt-1" style={{ color: sub }}>
                    <span>Rara</span><span>Casi segura</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: sub }}>
                    Severidad: {evalForm.severidad}
                  </label>
                  <input type="range" min={1} max={5} value={evalForm.severidad}
                         onChange={e => setEvalForm(f => ({ ...f, severidad: Number(e.target.value) }))}
                         className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-xs mt-1" style={{ color: sub }}>
                    <span>Insignificante</span><span>Catastrófico</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Nivel de riesgo calculado</p>
                <p className="text-2xl font-bold" style={{ color: text }}>{nivelRiesgo}</p>
                <Badge text={nivelLabel} colorClass={NIVEL_COLOR[nivelLabel]} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={evalForm.es_residual}
                       onChange={e => setEvalForm(f => ({ ...f, es_residual: e.target.checked }))}
                       className="accent-indigo-500" />
                <span className="text-sm" style={{ color: text }}>Es evaluación residual (post-control)</span>
              </label>

              <button onClick={guardarEvaluacion} disabled={loading}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#6366F1' }}>
                {loading ? 'Guardando...' : 'Guardar evaluación'}
              </button>

              {detalle?.evaluaciones?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: sub }}>Historial de evaluaciones</p>
                  <div className="space-y-2">
                    {detalle.evaluaciones.map(ev => (
                      <div key={ev.id} className="rounded-lg p-3 flex items-center justify-between"
                           style={{ backgroundColor: input }}>
                        <div>
                          <p className="text-xs" style={{ color: text }}>
                            P:{ev.probabilidad} × S:{ev.severidad} = {ev.probabilidad * ev.severidad}
                          </p>
                          <p className="text-xs" style={{ color: sub }}>
                            {new Date(ev.fecha_evaluacion).toLocaleDateString('es-CO')}
                            {ev.es_residual && ' · Residual'}
                          </p>
                        </div>
                        <Badge text={ev.nivel_riesgo} colorClass={NIVEL_COLOR[ev.nivel_riesgo] || 'bg-gray-500/20 text-gray-300'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CONTROLES ── */}
          {tab === 'controles' && (
            <div className="space-y-4">
              {detalle?.medidas_control?.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: sub }}>No hay medidas de control registradas.</p>
              )}
              {detalle?.medidas_control?.map(m => (
                <div key={m.id} className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  {editingControlId === m.id ? (
                    <div className="space-y-2">
                      <textarea rows={2} value={editControlForm.descripcion}
                                onChange={e => setEditControlForm(f => ({ ...f, descripcion: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                                style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={editControlForm.estado}
                                onChange={e => setEditControlForm(f => ({ ...f, estado: e.target.value }))}
                                className="rounded-lg px-3 py-2 text-sm outline-none"
                                style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                          <option value="">Estado...</option>
                          {Object.entries(ESTADOS_CONTROL).map(([v, label]) => (
                            <option key={v} value={v}>{label}</option>
                          ))}
                        </select>
                        <input type="text" placeholder="Evidencia (URL o descripción)"
                               value={editControlForm.evidencia}
                               onChange={e => setEditControlForm(f => ({ ...f, evidencia: e.target.value }))}
                               className="rounded-lg px-3 py-2 text-sm outline-none"
                               style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={guardarEdicionControl} disabled={loading}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: '#6366F1' }}>
                          {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingControlId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs"
                                style={{ color: sub }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: text }}>{m.descripcion}</p>
                        <p className="text-xs mt-1" style={{ color: sub }}>
                          Tipo: {m.tipo} · Estado: {ESTADOS_CONTROL[m.estado] || m.estado || ESTADOS_CONTROL.planificada}
                        </p>
                        {m.evidencia && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: sub }}>
                            Evidencia: {m.evidencia}
                          </p>
                        )}
                      </div>
                      <button onClick={() => iniciarEdicionControl(m)}
                              className="text-xs font-semibold shrink-0"
                              style={{ color: '#6366F1' }}>
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                <p className="text-sm font-semibold" style={{ color: text }}>Nueva medida de control</p>
                <textarea rows={2} placeholder="Descripción de la medida..." value={controlForm.descripcion}
                          onChange={e => setControlForm(f => ({ ...f, descripcion: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                          style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={controlForm.tipo} onChange={e => setControlForm(f => ({ ...f, tipo: e.target.value }))}
                          className="rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                    <option value="">Tipo de control...</option>
                    {TIPOS_CONTROL.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <input type="date" value={controlForm.fecha_limite}
                         onChange={e => setControlForm(f => ({ ...f, fecha_limite: e.target.value }))}
                         className="rounded-lg px-3 py-2 text-sm outline-none"
                         style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                </div>
                <button onClick={guardarControl} disabled={loading}
                        className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#6366F1' }}>
                  {loading ? 'Guardando...' : 'Guardar control'}
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
export default function Riesgos() {
  const { darkMode } = useOutletContext()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'

  const [peligros, setPeligros]         = useState([])
  const [matriz, setMatriz]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalTab, setModalTab]         = useState('evaluacion')
  const [searchParams, setSearchParams] = useSearchParams()

  const cargar = () => {
    setLoading(true)
    Promise.all([riesgosAPI.getPeligros(), riesgosAPI.getMatriz()])
      .then(([p, m]) => { setPeligros(p.data); setMatriz(m.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  // Deep link desde notificaciones: /riesgos?riesgo={id}&control=1
  useEffect(() => {
    const riesgoId = searchParams.get('riesgo')
    if (!riesgoId || peligros.length === 0) return
    const encontrado = peligros.find(p => String(p.id) === riesgoId)
    if (encontrado) {
      setModalTab(searchParams.get('control') ? 'controles' : 'evaluacion')
      setModalDetalle(encontrado)
    }
    setSearchParams({})
  }, [peligros, searchParams])

  const matrizItems = [
    { label: 'Crítico',  key: 'criticos',  color: 'text-red-400',    bg: 'bg-red-500/10' },
    { label: 'Alto',     key: 'altos',     color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Medio',    key: 'medios',    color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Bajo',     key: 'bajos',     color: 'text-green-400',  bg: 'bg-green-500/10' },
  ]

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Evaluación de Riesgos</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {peligros.length} {peligros.length === 1 ? 'peligro identificado' : 'peligros identificados'}
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#6366F1' }}>
          <Plus size={16} /> Nuevo Peligro
        </button>
      </div>

      {/* Matriz resumen */}
      {matriz && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {matrizItems.map(({ label, key, color, bg }) => (
            <div key={key} className={`rounded-xl p-4 ${bg}`} style={{ border: `1px solid ${border}` }}>
              <p className="text-xs font-medium" style={{ color: sub }}>{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{matriz[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de peligros */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando peligros...</p>
      ) : peligros.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>No hay peligros identificados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {peligros.map(p => (
            <div key={p.id} className="rounded-xl p-5 flex flex-col gap-3"
                 style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm capitalize" style={{ color: text }}>{p.tipo}</p>
                <Badge text={p.activo ? 'Activo' : 'Inactivo'}
                       colorClass={p.activo ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'} />
              </div>
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{p.descripcion}</p>
              <div className="flex items-center gap-1 text-xs" style={{ color: sub }}>
                <Users className="w-3.5 h-3.5 shrink-0" />
                {p.trabajadores_expuestos} trabajadores expuestos
              </div>
              <button onClick={() => setModalDetalle(p)}
                      className="text-xs font-semibold hover:underline text-left mt-auto"
                      style={{ color: '#6366F1' }}>
                Ver evaluación →
              </button>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <ModalNuevoPeligro darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreado={cargar} />
      )}
      {modalDetalle && (
        <ModalDetalle darkMode={darkMode} peligro={modalDetalle} initialTab={modalTab} onClose={() => setModalDetalle(null)} onRefresh={cargar} />
      )}
    </div>
  )
}