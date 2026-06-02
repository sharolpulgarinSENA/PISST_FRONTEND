import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, X, BookOpen, ChevronDown, Check, Power, PowerOff, Calendar, MapPin } from 'lucide-react'
import { capacitacionesAPI, areasAPI } from '../services/api'

/* ══════════════════════════════════════════
   UTIL: convierte datetime-local → ISO 8601
   con offset de Colombia (-05:00) para no
   perder la hora al enviar al backend.
   Entrada: "2026-06-15T09:00" (string del input)
   Salida:  "2026-06-15T09:00:00-05:00"
══════════════════════════════════════════ */
function toColombiaISO(datetimeLocal) {
  if (!datetimeLocal) return null
  // datetime-local da "YYYY-MM-DDTHH:mm", le agregamos segundos y offset Colombia
  const withSeconds = datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal
  return `${withSeconds}-05:00`
}

/* ══════════════════════════════════════════
   UTIL: muestra una fecha del backend siempre
   en hora Colombia (UTC-5), sin importar el
   timezone del navegador ni cómo devuelva el
   backend la fecha.
   - Si viene con offset (ej: "...−05:00") la
     usa directamente.
   - Si viene sin offset / con "Z" (UTC), resta
     5 horas para mostrar hora Colombia.
══════════════════════════════════════════ */
function formatColombia(fechaStr, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!fechaStr) return ''
  // El backend devuelve fechas sin offset (ej: "2026-05-29T14:52:00").
  // Sin Z ni offset, Date() las interpreta como hora LOCAL del navegador → mal.
  // Si no tiene offset explícito, le agregamos Z para que Date() las trate como UTC.
  const normalized = /[Z+\-]\d{2}:\d{2}$|Z$/.test(fechaStr) ? fechaStr : fechaStr + 'Z'
  return new Intl.DateTimeFormat('es-CO', {
    ...opts,
    timeZone: 'America/Bogota',
  }).format(new Date(normalized))
}

/* ══════════════════════════════════════════
   HOOK: useAreas — carga áreas una sola vez
══════════════════════════════════════════ */
function useAreas() {
  const [areas, setAreas]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    areasAPI.getAll()
      .then(r => setAreas(r.data))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false))
  }, [])

  return { areas, loading }
}

/* ══════════════════════════════════════════
   COMPONENTE: SelectorAreas (multiselect)
══════════════════════════════════════════ */
function SelectorAreas({ areas, selected, onChange, darkMode }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const card   = darkMode ? '#111827' : '#FFFFFF'

  // cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  const label = selected.length === 0
    ? 'Sin áreas asignadas'
    : selected.length === 1
      ? areas.find(a => a.id === selected[0])?.nombre ?? '1 área'
      : `${selected.length} áreas seleccionadas`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none"
        style={{ backgroundColor: input, color: selected.length ? text : sub, border: `1px solid ${border}` }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} style={{ color: sub, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden"
             style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          {areas.length === 0 ? (
            <p className="px-3 py-3 text-xs" style={{ color: sub }}>No hay áreas disponibles.</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {areas.map(a => {
                const isSelected = selected.includes(a.id)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-indigo-500/10 transition"
                      style={{ color: isSelected ? '#6366F1' : text }}
                    >
                      <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: isSelected ? '#6366F1' : input, border: `1px solid ${isSelected ? '#6366F1' : border}` }}>
                        {isSelected && <Check size={10} color="#fff" />}
                      </span>
                      {a.nombre}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: NUEVA CAPACITACIÓN
══════════════════════════════════════════ */
function ModalNuevaCapacitacion({ darkMode, onClose, onCreada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const { areas, loading: loadingAreas } = useAreas()

  const [form, setForm]         = useState({ titulo: '', objetivos: '', duracion_horas: 1 })
  const [areaIds, setAreaIds]   = useState([])
  const [errores, setErrores]   = useState({})
  const [banner, setBanner]     = useState('')
  const [loading, setLoading]   = useState(false)

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
        area_ids: areaIds.length > 0 ? areaIds : undefined,
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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nueva Capacitación</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>
          )}

          {/* Título */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Título *</label>
            <input
              type="text"
              placeholder="Ej: Manejo de EPP"
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores.titulo ? 'border-red-500' : 'border-transparent'}`}
              style={{ backgroundColor: input, color: text }}
            />
          </div>

          {/* Objetivos */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos</label>
            <textarea
              rows={3}
              placeholder="Describe los objetivos de la capacitación..."
              value={form.objetivos}
              onChange={e => set('objetivos', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent resize-none"
              style={{ backgroundColor: input, color: text }}
            />
          </div>

          {/* Duración */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Duración (horas)</label>
            <input
              type="number"
              min={1}
              value={form.duracion_horas}
              onChange={e => set('duracion_horas', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
              style={{ backgroundColor: input, color: text }}
            />
          </div>

          {/* Áreas */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              Áreas dirigidas
              {loadingAreas && <span className="ml-1 opacity-50">(cargando…)</span>}
            </label>
            <SelectorAreas
              areas={areas}
              selected={areaIds}
              onChange={setAreaIds}
              darkMode={darkMode}
            />
            <p className="text-xs mt-1" style={{ color: sub }}>Opcional — puedes asignar áreas después.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button
            onClick={guardar}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#6366F1' }}
          >
            {loading ? 'Creando...' : 'Crear capacitación'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: REPROGRAMAR SESIÓN
══════════════════════════════════════════ */
function ModalReprogramar({ darkMode, sesion, onClose, onReprogramada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  // pre-fill: convertir la fecha del backend a hora Colombia para el input datetime-local
  const fechaActual = sesion.fecha
    ? (() => {
        // Normalizar: si no tiene offset, asumir UTC (el backend no envía offset)
        const raw = sesion.fecha
        const normalized = /[Z+\-]\d{2}:\d{2}$|Z$/.test(raw) ? raw : raw + 'Z'
        const fmt = new Intl.DateTimeFormat('es-CO', {
          timeZone: 'America/Bogota',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        })
        const parts = Object.fromEntries(fmt.formatToParts(new Date(normalized)).map(p => [p.type, p.value]))
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
      })()
    : ''

  const [form, setForm]     = useState({ fecha: fechaActual, lugar: sesion.lugar ?? '' })
  const [banner, setBanner] = useState('')
  const [loading, setLoading] = useState(false)

  const guardar = async () => {
    if (!form.fecha) { setBanner('La fecha es obligatoria.'); return }
    setBanner('')
    setLoading(true)
    try {
      const body = {}
      if (form.fecha) body.fecha = toColombiaISO(form.fecha)
      if (form.lugar) body.lugar = form.lugar
      await capacitacionesAPI.reprogramarSesion(sesion.id, body)
      onReprogramada()
      onClose()
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al reprogramar la sesión.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
          <h3 className="font-bold text-base" style={{ color: text }}>Reprogramar sesión</h3>
          <button onClick={onClose}><X size={16} style={{ color: sub }} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{banner}</div>
          )}

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              <Calendar size={11} className="inline mr-1" />Nueva fecha y hora *
            </label>
            <input
              type="datetime-local"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
              <MapPin size={11} className="inline mr-1" />Lugar
            </label>
            <input
              type="text"
              placeholder="Ej: Auditorio principal"
              value={form.lugar}
              onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button
            onClick={guardar}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#6366F1' }}
          >
            {loading ? 'Guardando...' : 'Reprogramar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE CAPACITACIÓN
══════════════════════════════════════════ */
function ModalDetalle({ darkMode, capacitacion: capacitacionInicial, onClose, onActualizada }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  // estado local de la capacitación (se actualiza al suspender/activar)
  const [capacitacion, setCapacitacion] = useState(capacitacionInicial)

  const [tab, setTab]                   = useState('sesiones')
  const [sesiones, setSesiones]         = useState([])
  const [banner, setBanner]             = useState('')
  const [sesionForm, setSesionForm]     = useState({ fecha: '', lugar: '' })
  const [loading, setLoading]           = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [sesionReprogramar, setSesionReprogramar] = useState(null)

  // ── Estado para editar capacitación ──
  const { areas, loading: loadingAreas } = useAreas()
  const [editForm, setEditForm]   = useState({
    titulo:        capacitacionInicial.titulo,
    objetivos:     capacitacionInicial.objetivos ?? '',
    duracion_horas: capacitacionInicial.duracion_horas,
  })
  const [editAreaIds, setEditAreaIds]   = useState(
    capacitacionInicial.areas?.map(a => a.id) ?? []
  )
  const [loadingEdit, setLoadingEdit]   = useState(false)
  const [bannerEdit, setBannerEdit]     = useState({ type: '', msg: '' })

  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  const guardarEdicion = async () => {
    if (!editForm.titulo.trim()) { setBannerEdit({ type: 'error', msg: 'El título es obligatorio.' }); return }
    setBannerEdit({ type: '', msg: '' })
    setLoadingEdit(true)
    try {
      const { data } = await capacitacionesAPI.actualizar(capacitacion.id, {
        titulo:         editForm.titulo.trim(),
        objetivos:      editForm.objetivos.trim() || undefined,
        duracion_horas: Number(editForm.duracion_horas),
        area_ids:       editAreaIds.length > 0 ? editAreaIds : [],
      })
      setCapacitacion(data)
      onActualizada()
      setBannerEdit({ type: 'ok', msg: 'Cambios guardados correctamente.' })
    } catch (err) {
      setBannerEdit({ type: 'error', msg: err.response?.data?.detail || 'Error al guardar los cambios.' })
    } finally { setLoadingEdit(false) }
  }

  const cargarSesiones = () =>
    capacitacionesAPI.getSesiones(capacitacion.id)
      .then(r => setSesiones(r.data))
      .catch(console.error)

  useEffect(() => { cargarSesiones() }, [capacitacion.id])

  /* ── Suspender / Activar ── */
  const toggleActivo = async () => {
    setLoadingToggle(true)
    setBanner('')
    try {
      const { data } = capacitacion.activo
        ? await capacitacionesAPI.suspender(capacitacion.id)
        : await capacitacionesAPI.activar(capacitacion.id)
      setCapacitacion(data)
      onActualizada()   // refresca el listado principal
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al cambiar el estado.')
    } finally { setLoadingToggle(false) }
  }

  /* ── Nueva sesión ── */
  const crearSesion = async () => {
    if (!sesionForm.fecha) { setBanner('La fecha es obligatoria.'); return }
    setBanner('')
    setLoading(true)
    try {
      await capacitacionesAPI.crearSesion({
        fecha: toColombiaISO(sesionForm.fecha),
        lugar: sesionForm.lugar || undefined,
        capacitacion_id: capacitacion.id,
      })
      await cargarSesiones()
      setSesionForm({ fecha: '', lugar: '' })
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al crear la sesión.')
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'sesiones', label: '📅 Sesiones' },
    { id: 'info',     label: 'ℹ️ Información' },
    { id: 'editar',   label: '✏️ Editar' },
  ]

  const esActiva = capacitacion.activo

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
           style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
             style={{ backgroundColor: card, border: `1px solid ${border}` }}>

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b gap-3" style={{ borderColor: border }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg truncate" style={{ color: text }}>{capacitacion.titulo}</h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${esActiva ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {esActiva ? 'Activa' : 'Suspendida'}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: sub }}>
                {capacitacion.duracion_horas}h
                {capacitacion.areas?.length > 0 && (
                  <> · {capacitacion.areas.map(a => a.nombre).join(', ')}</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Botón suspender / activar */}
              <button
                onClick={toggleActivo}
                disabled={loadingToggle}
                title={esActiva ? 'Suspender capacitación' : 'Activar capacitación'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                style={{
                  backgroundColor: esActiva ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                  color: esActiva ? '#EF4444' : '#6366F1',
                }}
              >
                {loadingToggle
                  ? '...'
                  : esActiva
                    ? <><PowerOff size={13} /> Suspender</>
                    : <><Power size={13} /> Activar</>
                }
              </button>
              <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6" style={{ borderColor: border }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setBanner('') }}
                className="px-4 py-3 text-sm font-medium border-b-2 transition"
                style={{
                  borderColor: tab === t.id ? '#6366F1' : 'transparent',
                  color: tab === t.id ? '#6366F1' : sub,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {banner && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>
            )}

            {/* ── TAB SESIONES ── */}
            {tab === 'sesiones' && (
              <div className="space-y-3">
                {sesiones.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: sub }}>No hay sesiones programadas.</p>
                )}

                {sesiones.map(s => (
                  <div key={s.id} className="rounded-lg p-3 flex items-center justify-between gap-3"
                       style={{ backgroundColor: input }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: text }}>
                        {formatColombia(s.fecha)}
                      </p>
                      {s.lugar && <p className="text-xs mt-0.5 truncate" style={{ color: sub }}>{s.lugar}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {s.activa ? 'Activa' : 'Finalizada'}
                      </span>
                      {/* Solo se puede reprogramar sesiones activas */}
                      {s.activa && (
                        <button
                          onClick={() => setSesionReprogramar(s)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg transition"
                          style={{ color: '#6366F1', backgroundColor: 'rgba(99,102,241,0.1)' }}
                        >
                          Reprogramar
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Nueva sesión */}
                <div className="rounded-xl p-4 space-y-3 mt-2"
                     style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                  <p className="text-sm font-semibold" style={{ color: text }}>Nueva sesión</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: sub }}>Fecha y hora *</label>
                      <input
                        type="datetime-local"
                        value={sesionForm.fecha}
                        onChange={e => setSesionForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: sub }}>Lugar</label>
                      <input
                        type="text"
                        placeholder="Ej: Sala de reuniones"
                        value={sesionForm.lugar}
                        onChange={e => setSesionForm(f => ({ ...f, lugar: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={crearSesion}
                    disabled={loading}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#6366F1' }}
                  >
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
                  <p className="text-sm font-semibold" style={{ color: esActiva ? '#22C55E' : '#9CA3AF' }}>
                    {esActiva ? 'Activa' : 'Suspendida'}
                  </p>
                </div>
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

            {/* ── TAB EDITAR ── */}
            {tab === 'editar' && (
              <div className="space-y-4">
                {bannerEdit.msg && (
                  <div className={`text-sm rounded-lg px-4 py-3 border ${
                    bannerEdit.type === 'ok'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {bannerEdit.msg}
                  </div>
                )}

                {/* Título */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Título *</label>
                  <input
                    type="text"
                    value={editForm.titulo}
                    onChange={e => setEdit('titulo', e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                    style={{ backgroundColor: input, color: text }}
                  />
                </div>

                {/* Objetivos */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Objetivos</label>
                  <textarea
                    rows={3}
                    value={editForm.objetivos}
                    onChange={e => setEdit('objetivos', e.target.value)}
                    placeholder="Describe los objetivos..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent resize-none"
                    style={{ backgroundColor: input, color: text }}
                  />
                </div>

                {/* Duración */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Duración (horas)</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.duracion_horas}
                    onChange={e => setEdit('duracion_horas', e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                    style={{ backgroundColor: input, color: text }}
                  />
                </div>

                {/* Áreas */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
                    Áreas dirigidas
                    {loadingAreas && <span className="ml-1 opacity-50">(cargando…)</span>}
                  </label>
                  <SelectorAreas
                    areas={areas}
                    selected={editAreaIds}
                    onChange={setEditAreaIds}
                    darkMode={darkMode}
                  />
                </div>

                <button
                  onClick={guardarEdicion}
                  disabled={loadingEdit}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mt-2"
                  style={{ backgroundColor: '#6366F1' }}
                >
                  {loadingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal reprogramar (z-index mayor para que quede sobre el detalle) */}
      {sesionReprogramar && (
        <ModalReprogramar
          darkMode={darkMode}
          sesion={sesionReprogramar}
          onClose={() => setSesionReprogramar(null)}
          onReprogramada={() => { cargarSesiones(); setSesionReprogramar(null) }}
        />
      )}
    </>
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
  const [filtro, setFiltro]                 = useState('activas') // 'activas' | 'todas'

  const cargar = async () => {
  setLoading(true)

  // 1. Listado (lo principal): si falla cobertura, NO debe romper esto
  try {
    const { data } = await capacitacionesAPI.getAll()
    console.log('📦 Capacitaciones raw:', data)   // <-- mira esto en la consola
    const arr = Array.isArray(data)
      ? data
      : data.items ?? data.capacitaciones ?? data.data ?? []
    setCapacitaciones(arr)
  } catch (err) {
    console.error('Error cargando capacitaciones:', err)
  } finally {
    setLoading(false)
  }

  // 2. Cobertura aparte: si falla, solo se pierde la barrita
  try {
    const { data } = await capacitacionesAPI.getCobertura()
    setCobertura(data)
  } catch (err) {
    console.error('Error cargando cobertura:', err)
    setCobertura(null)
  }
}

  useEffect(() => { cargar() }, [])

  // El backend solo devuelve activas, pero guardamos todas para filtrar localmente
  // si en algún momento devuelve inactivas también
  const lista = filtro === 'activas'
    ? capacitaciones.filter(c => c.activo)
    : capacitaciones

  // Cuando se cierra el modal de detalle con actualización, refrescar
  const handleActualizada = () => cargar()

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Capacitaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {lista.length} {lista.length === 1 ? 'programa' : 'programas'} {filtro === 'activas' ? 'activos' : 'en total'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro activas / todas */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
            {['activas', 'todas'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="px-3 py-1.5 text-xs font-medium transition"
                style={{
                  backgroundColor: filtro === f ? '#6366F1' : card,
                  color: filtro === f ? '#fff' : sub,
                }}
              >
                {f === 'activas' ? 'Activas' : 'Todas'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalNuevo(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#6366F1' }}
          >
            <Plus size={16} /> Nueva Capacitación
          </button>
        </div>
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
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${cobertura.porcentaje_cobertura ?? 0}%`, backgroundColor: '#6366F1' }}
            />
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando capacitaciones...</p>
      ) : lista.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>
            {filtro === 'activas' ? 'No hay capacitaciones activas.' : 'No hay capacitaciones registradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map(c => (
            <div
              key={c.id}
              className="rounded-xl p-5 flex flex-col gap-3 transition"
              style={{
                backgroundColor: card,
                border: `1px solid ${border}`,
                opacity: c.activo ? 1 : 0.65,
              }}
            >
              {/* Título + badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm leading-snug" style={{ color: text }}>{c.titulo}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${c.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {c.activo ? 'Activa' : 'Suspendida'}
                </span>
              </div>

              {/* Objetivos */}
              {c.objetivos && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }}>{c.objetivos}</p>
              )}

              {/* Áreas */}
              {c.areas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.areas.slice(0, 3).map(a => (
                    <span key={a.id} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                      {a.nombre}
                    </span>
                  ))}
                  {c.areas.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: sub }}>
                      +{c.areas.length - 3} más
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <p className="text-xs" style={{ color: sub }}>⏱ {c.duracion_horas}h</p>
                <button
                  onClick={() => setModalDetalle(c)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#6366F1' }}
                >
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {modalNuevo && (
        <ModalNuevaCapacitacion
          darkMode={darkMode}
          onClose={() => setModalNuevo(false)}
          onCreada={cargar}
        />
      )}
      {modalDetalle && (
        <ModalDetalle
          darkMode={darkMode}
          capacitacion={modalDetalle}
          onClose={() => setModalDetalle(null)}
          onActualizada={handleActualizada}
        />
      )}
    </div>
  )
}