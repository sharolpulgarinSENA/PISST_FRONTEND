import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, X, BookOpen, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { capacitacionesAPI } from '../services/api'

/* ══════════════════════════════════════════
   MODAL: NUEVA CAPACITACIÓN
══════════════════════════════════════════ */
function ModalNuevaCapacitacion({ darkMode, onClose, onCreada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]       = useState({ titulo: '', objetivos: '', duracion_horas: 1 })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.titulo) { setErrores({ titulo: true }); setBanner('Por favor, diligencia todos los campos obligatorios para continuar.'); return }
    setBanner('')
    setLoading(true)
    try {
      await capacitacionesAPI.crear({
        titulo: form.titulo,
        objetivos: form.objetivos || undefined,
        duracion_horas: Number(form.duracion_horas),
      })
      onCreada()
      onClose()
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al crear la capacitación.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nueva Capacitación</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
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
            <textarea rows={3} placeholder="Describe los objetivos de la capacitación..." value={form.objetivos}
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
   MODAL: DETALLE CAPACITACIÓN
══════════════════════════════════════════ */
function ModalDetalle({ darkMode, capacitacion, onClose }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]         = useState('sesiones')
  const [sesiones, setSesiones] = useState([])
  const [banner, setBanner]   = useState('')
  const [sesionForm, setSesionForm] = useState({ fecha: '', lugar: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    capacitacionesAPI.getSesiones(capacitacion.id)
      .then(r => setSesiones(r.data))
      .catch(console.error)
  }, [capacitacion.id])

  const crearSesion = async () => {
    if (!sesionForm.fecha) { setBanner('La fecha es obligatoria.'); return }
    setBanner('')
    setLoading(true)
    try {
      await capacitacionesAPI.crearSesion({
        fecha: new Date(sesionForm.fecha).toISOString(),
        lugar: sesionForm.lugar || undefined,
        capacitacion_id: capacitacion.id,
      })
      const r = await capacitacionesAPI.getSesiones(capacitacion.id)
      setSesiones(r.data)
      setSesionForm({ fecha: '', lugar: '' })
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al crear la sesión.')
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'sesiones',  label: '📅 Sesiones' },
    { id: 'info',      label: 'ℹ️ Información' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: text }}>{capacitacion.titulo}</h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {capacitacion.duracion_horas}h · {capacitacion.activo ? 'Activa' : 'Inactiva'}
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

          {/* ── TAB SESIONES ── */}
          {tab === 'sesiones' && (
            <div className="space-y-4">
              {sesiones.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: sub }}>No hay sesiones programadas.</p>
              )}
              {sesiones.map(s => (
                <div key={s.id} className="rounded-lg p-3 flex items-center justify-between"
                     style={{ backgroundColor: input }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: text }}>
                      {new Date(s.fecha).toLocaleString('es-CO')}
                    </p>
                    {s.lugar && <p className="text-xs mt-0.5" style={{ color: sub }}>{s.lugar}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.activa ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {s.activa ? 'Activa' : 'Finalizada'}
                  </span>
                </div>
              ))}

              {/* Nueva sesión */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                <p className="text-sm font-semibold" style={{ color: text }}>Nueva sesión</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: sub }}>Fecha y hora *</label>
                    <input type="datetime-local" value={sesionForm.fecha}
                           onChange={e => setSesionForm(f => ({ ...f, fecha: e.target.value }))}
                           className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                           style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
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

          {/* ── TAB INFO ── */}
          {tab === 'info' && (
            <div className="space-y-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Objetivos</p>
                <p className="text-sm" style={{ color: text }}>{capacitacion.objetivos || 'Sin objetivos registrados.'}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Duración</p>
                <p className="text-sm" style={{ color: text }}>{capacitacion.duracion_horas} horas</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Estado</p>
                <p className="text-sm" style={{ color: text }}>{capacitacion.activo ? 'Activa' : 'Inactiva'}</p>
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
export default function Capacitaciones() {
  const { darkMode } = useOutletContext()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'

  const [capacitaciones, setCapacitaciones] = useState([])
  const [cobertura, setCobertura]           = useState(null)
  const [loading, setLoading]               = useState(true)
  const [modalNuevo, setModalNuevo]         = useState(false)
  const [modalDetalle, setModalDetalle]     = useState(null)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      capacitacionesAPI.getAll(),
      capacitacionesAPI.getCobertura(),
    ])
      .then(([c, cob]) => { setCapacitaciones(c.data); setCobertura(cob.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Capacitaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {capacitaciones.length} {capacitaciones.length === 1 ? 'programa registrado' : 'programas registrados'}
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#6366F1' }}>
          <Plus size={16} /> Nueva Capacitación
        </button>
      </div>

      {/* Cobertura */}
      {cobertura && (
        <div className="rounded-xl p-4 mb-6 flex items-center justify-between"
             style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          <div>
            <p className="text-xs font-medium" style={{ color: sub }}>Cobertura del plan anual</p>
            <p className="text-2xl font-bold mt-1" style={{ color: text }}>
              {cobertura.porcentaje_cobertura ?? cobertura.cobertura ?? 0}%
            </p>
          </div>
          <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-full rounded-full" style={{ width: `${cobertura.porcentaje_cobertura ?? 0}%`, backgroundColor: '#6366F1' }} />
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando capacitaciones...</p>
      ) : capacitaciones.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>No hay capacitaciones registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capacitaciones.map(c => (
            <div key={c.id} className="rounded-xl p-5 flex flex-col gap-3"
                 style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm" style={{ color: text }}>{c.titulo}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${c.activo ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                  {c.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {c.objetivos && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{c.objetivos}</p>
              )}
              <p className="text-xs" style={{ color: sub }}>⏱ {c.duracion_horas} horas</p>
              <button onClick={() => setModalDetalle(c)}
                      className="text-xs font-semibold hover:underline text-left mt-auto"
                      style={{ color: '#6366F1' }}>
                Ver detalle →
              </button>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <ModalNuevaCapacitacion darkMode={darkMode} onClose={() => setModalNuevo(false)} onCreada={cargar} />
      )}
      {modalDetalle && (
        <ModalDetalle darkMode={darkMode} capacitacion={modalDetalle} onClose={() => setModalDetalle(null)} />
      )}
    </div>
  )
}