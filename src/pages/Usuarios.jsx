import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, X, UserCheck, UserX, Pencil, Building2, Briefcase, ChevronDown } from 'lucide-react'
import { usuariosAPI, areasAPI, cargosAPI } from '../services/api'

// SST solo puede crear empleados (backend bloquea sst/gerencia/admin con 403)
const ROLES_CREAR = ['empleado']
const ROL_COLOR = {
  sst:      'bg-indigo-500/20 text-indigo-300',
  gerencia: 'bg-purple-500/20 text-purple-300',
  empleado: 'bg-green-500/20 text-green-300',
}
const ROL_LABEL = {
  sst: 'Encargado SST', gerencia: 'Gerencia', empleado: 'Empleado'
}

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{text}</span>
}

/* ══════════════════════════════════════════
   HOOK: carga áreas y cargos desde la DB
══════════════════════════════════════════ */
function useAreasYCargos() {
  const [areas,   setAreas]   = useState([])
  const [cargos,  setCargos]  = useState([])
  const [loading, setLoading] = useState(true)

  const recargar = () => {
    setLoading(true)
    Promise.all([areasAPI.getAll(), cargosAPI.getAll()])
      .then(([a, c]) => { setAreas(a.data); setCargos(c.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { recargar() }, [])
  return { areas, cargos, loading, recargar }
}

/* ══════════════════════════════════════════
   COMPONENTE: SelectDB — dropdown desde DB
══════════════════════════════════════════ */
function SelectDB({ value, onChange, items, placeholder, loading, darkMode, disabled }) {
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const border = darkMode ? '#374151' : '#E5E7EB'

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none appearance-none pr-8"
        style={{
          backgroundColor: input,
          color: value ? text : sub,
          border: `1px solid ${border}`,
          opacity: disabled ? 0.5 : 1,
        }}
        disabled={loading || disabled}
      >
        <option value="">{loading ? 'Cargando...' : placeholder}</option>
        {items.map(i => (
          <option key={i.id} value={i.id}>{i.nombre}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                   style={{ color: sub }} />
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: GESTIONAR ÁREAS Y CARGOS
   Solo GET + POST (sin editar/eliminar)
══════════════════════════════════════════ */
function ModalGestionarOrg({ darkMode, onClose, onCambiado }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]           = useState('areas')
  const [areas, setAreas]       = useState([])
  const [cargos, setCargos]     = useState([])
  const [cargando, setCargando] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [banner, setBanner]     = useState({ type: '', msg: '' })

  const [areaNombre, setAreaNombre] = useState('')
  const [areaDesc, setAreaDesc]     = useState('')
  const [cargoNombre, setCargoNombre] = useState('')
  const [cargoAreaId, setCargoAreaId] = useState('')

  const cargar = () => {
    setCargando(true)
    Promise.all([areasAPI.getAll(), cargosAPI.getAll()])
      .then(([a, c]) => { setAreas(a.data); setCargos(c.data) })
      .catch(() => setBanner({ type: 'error', msg: 'Error al cargar los datos.' }))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const mostrarOk = (msg) => {
    setBanner({ type: 'ok', msg })
    setTimeout(() => setBanner({ type: '', msg: '' }), 2500)
  }

  const crearArea = async () => {
    if (!areaNombre.trim()) return
    setLoading(true)
    try {
      await areasAPI.crear({ nombre: areaNombre.trim(), descripcion: areaDesc.trim() || undefined })
      setAreaNombre('')
      setAreaDesc('')
      cargar()
      onCambiado()
      mostrarOk('Área creada correctamente.')
    } catch (err) {
      setBanner({ type: 'error', msg: err.response?.data?.detail || 'Error al crear el área.' })
    } finally { setLoading(false) }
  }

  const crearCargo = async () => {
    if (!cargoNombre.trim()) { setBanner({ type: 'error', msg: 'El nombre del cargo es obligatorio.' }); return }
    if (!cargoAreaId)        { setBanner({ type: 'error', msg: 'Selecciona el área a la que pertenece el cargo.' }); return }
    setLoading(true)
    try {
      await cargosAPI.crear({ nombre: cargoNombre.trim(), area_id: cargoAreaId })
      setCargoNombre('')
      setCargoAreaId('')
      cargar()
      onCambiado()
      mostrarOk('Cargo creado correctamente.')
    } catch (err) {
      setBanner({ type: 'error', msg: err.response?.data?.detail || 'Error al crear el cargo.' })
    } finally { setLoading(false) }
  }

  const items = tab === 'areas' ? areas : cargos

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: text }}>Organización</h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>Gestiona áreas y cargos de la empresa</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: border }}>
          {[{ id: 'areas', label: '🏢 Áreas' }, { id: 'cargos', label: '💼 Cargos' }].map(t => (
            <button key={t.id}
                    onClick={() => { setTab(t.id); setBanner({ type: '', msg: '' }) }}
                    className="px-4 py-3 text-sm font-medium border-b-2 transition"
                    style={{ borderColor: tab === t.id ? '#6366F1' : 'transparent', color: tab === t.id ? '#6366F1' : sub }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {banner.msg && (
            <div className={`text-sm rounded-lg px-4 py-3 border ${
              banner.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>{banner.msg}</div>
          )}

          {/* ── Formulario crear área ── */}
          {tab === 'areas' && (
            <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
              <p className="text-sm font-semibold" style={{ color: text }}>Nueva área</p>
              <div>
                <label className="text-xs mb-1 block" style={{ color: sub }}>Nombre *</label>
                <input type="text" value={areaNombre} onChange={e => setAreaNombre(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && crearArea()}
                       placeholder="Ej: Producción"
                       className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                       style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: sub }}>Descripción (opcional)</label>
                <input type="text" value={areaDesc} onChange={e => setAreaDesc(e.target.value)}
                       placeholder="Ej: Área de manufactura"
                       className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                       style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
              </div>
              <button onClick={crearArea} disabled={loading || !areaNombre.trim()}
                      className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: '#6366F1' }}>
                <Plus size={14} /> Crear área
              </button>
            </div>
          )}

          {/* ── Formulario crear cargo ── */}
          {tab === 'cargos' && (
            <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
              <p className="text-sm font-semibold" style={{ color: text }}>Nuevo cargo</p>
              <div>
                <label className="text-xs mb-1 block" style={{ color: sub }}>Nombre *</label>
                <input type="text" value={cargoNombre} onChange={e => setCargoNombre(e.target.value)}
                       placeholder="Ej: Operario"
                       className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                       style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: sub }}>Área a la que pertenece *</label>
                <div className="relative">
                  <select value={cargoAreaId} onChange={e => setCargoAreaId(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none pr-8"
                          style={{ backgroundColor: card, color: cargoAreaId ? text : sub, border: `1px solid ${border}` }}
                          disabled={cargando}>
                    <option value="">{cargando ? 'Cargando áreas...' : 'Seleccionar área...'}</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                               style={{ color: sub }} />
                </div>
                {areas.length === 0 && !cargando && (
                  <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                    ⚠️ Primero crea un área antes de agregar cargos.
                  </p>
                )}
              </div>
              <button onClick={crearCargo} disabled={loading || !cargoNombre.trim() || !cargoAreaId}
                      className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: '#6366F1' }}>
                <Plus size={14} /> Crear cargo
              </button>
            </div>
          )}

          {/* ── Lista existentes ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: sub }}>
              {tab === 'areas' ? 'Áreas registradas' : 'Cargos registrados'}
            </p>
            {cargando ? (
              <p className="text-sm text-center py-4" style={{ color: sub }}>Cargando...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: sub }}>
                No hay {tab === 'areas' ? 'áreas' : 'cargos'} registrados aún.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map(item => {
                  const areaNombreItem = tab === 'cargos'
                    ? areas.find(a => a.id === item.area_id)?.nombre
                    : null
                  return (
                    <div key={item.id} className="rounded-lg px-4 py-3 flex items-center justify-between"
                         style={{ backgroundColor: input }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: text }}>{item.nombre}</span>
                        {item.descripcion && <p className="text-xs mt-0.5" style={{ color: sub }}>{item.descripcion}</p>}
                        {areaNombreItem  && <p className="text-xs mt-0.5" style={{ color: sub }}>{areaNombreItem}</p>}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                        {tab === 'areas' ? 'Área' : 'Cargo'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg font-medium" style={{ color: sub }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: NUEVO USUARIO
══════════════════════════════════════════ */
function ModalNuevoUsuario({ darkMode, areas, cargos, loadingOrg, onClose, onCreado }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]       = useState({ nombre: '', email: '', area_id: '', cargo_id: '' })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // cargos filtrados por área seleccionada
  const cargosFiltrados = form.area_id ? cargos.filter(c => c.area_id === form.area_id) : cargos

  const handleAreaChange = (areaId) => {
    const cargoActual = cargos.find(c => c.id === form.cargo_id)
    setForm(f => ({
      ...f,
      area_id: areaId,
      cargo_id: cargoActual?.area_id !== areaId ? '' : f.cargo_id,
    }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre) e.nombre = true
    if (!form.email)  e.email  = true
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBanner('Por favor, diligencia todos los campos obligatorios para continuar.'); return }
    setBanner('')
    setLoading(true)
    try {
      const areaSel  = areas.find(a => a.id === form.area_id)
      const cargoSel = cargos.find(c => c.id === form.cargo_id)
      await usuariosAPI.create({
        nombre:       form.nombre,
        email:        form.email,
        role:         'empleado',
        area_nombre:  areaSel?.nombre  || undefined,
        cargo_nombre: cargoSel?.nombre || undefined,
      })
      onCreado()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (err.response?.status === 403) {
        setBanner('No tienes permiso para crear usuarios con ese rol.')
      } else {
        setBanner(detail || 'Error al crear el usuario.')
      }
    } finally { setLoading(false) }
  }

  const inputCls = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Nuevo Usuario</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>
          )}

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Nombre completo *</label>
            <input type="text" placeholder="Nombre del usuario" value={form.nombre}
                   onChange={e => set('nombre', e.target.value)}
                   className={inputCls('nombre')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Correo electrónico *</label>
            <input type="email" placeholder="correo@empresa.com" value={form.email}
                   onChange={e => set('email', e.target.value)}
                   className={inputCls('email')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Rol</label>
            <div className="w-full rounded-lg px-3 py-2.5 text-sm flex items-center gap-2"
                 style={{ backgroundColor: input, color: sub }}>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">
                Empleado
              </span>
              <span className="text-xs">Único rol disponible para el SST</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Área</label>
              <SelectDB value={form.area_id} onChange={handleAreaChange} items={areas}
                        placeholder="Sin área..." loading={loadingOrg} darkMode={darkMode} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>
                Cargo
                {form.area_id && !loadingOrg && cargosFiltrados.length === 0 && (
                  <span className="ml-1" style={{ color: '#F59E0B' }}>— sin cargos</span>
                )}
              </label>
              <SelectDB value={form.cargo_id} onChange={v => set('cargo_id', v)} items={cargosFiltrados}
                        placeholder="Sin cargo..." loading={loadingOrg} darkMode={darkMode}
                        disabled={!form.area_id} />
            </div>
          </div>

          <div className="rounded-lg px-4 py-3 text-xs" style={{ backgroundColor: input, color: sub }}>
            ℹ️ Se enviará una contraseña temporal al correo del usuario.
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: EDITAR USUARIO
══════════════════════════════════════════ */
function ModalEditarUsuario({ darkMode, usuario, areas, cargos, loadingOrg, onClose, onActualizado }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const areaInicial  = areas.find(a => a.nombre === usuario.area_nombre)?.id  ?? ''
  const cargoInicial = cargos.find(c => c.nombre === usuario.cargo_nombre)?.id ?? ''

  const [form, setForm]     = useState({ nombre: usuario.nombre, activo: usuario.activo, area_id: areaInicial, cargo_id: cargoInicial })
  const [banner, setBanner] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const cargosFiltrados = form.area_id ? cargos.filter(c => c.area_id === form.area_id) : cargos

  const handleAreaChange = (areaId) => {
    const cargoActual = cargos.find(c => c.id === form.cargo_id)
    setForm(f => ({
      ...f,
      area_id: areaId,
      cargo_id: cargoActual?.area_id !== areaId ? '' : f.cargo_id,
    }))
  }

  const guardar = async () => {
    setLoading(true)
    try {
      const areaSel  = areas.find(a => a.id === form.area_id)
      const cargoSel = cargos.find(c => c.id === form.cargo_id)
      await usuariosAPI.update(usuario.id, {
        nombre:       form.nombre,
        activo:       form.activo,
        area_nombre:  areaSel?.nombre  || undefined,
        cargo_nombre: cargoSel?.nombre || undefined,
      })
      onActualizado()
      onClose()
    } catch (err) {
      setBanner(err.response?.data?.detail || 'Error al actualizar el usuario.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 className="font-bold text-lg" style={{ color: text }}>Editar Usuario</h2>
          <button onClick={onClose}><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{banner}</div>
          )}

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Nombre</label>
            <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                   className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                   style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Área</label>
            <SelectDB value={form.area_id} onChange={handleAreaChange} items={areas}
                      placeholder="Sin área asignada" loading={loadingOrg} darkMode={darkMode} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Cargo</label>
            <SelectDB value={form.cargo_id} onChange={v => set('cargo_id', v)} items={cargosFiltrados}
                      placeholder="Sin cargo asignado" loading={loadingOrg} darkMode={darkMode}
                      disabled={!form.area_id} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: text }}>Usuario activo</span>
            <button onClick={() => set('activo', !form.activo)}
                    className="w-12 h-6 rounded-full transition-colors relative"
                    style={{ backgroundColor: form.activo ? '#6366F1' : '#374151' }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                   style={{ left: form.activo ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
export default function Usuarios() {
  const { darkMode } = useOutletContext()
  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#9CA3AF' : '#6B7280'

  const [usuarios, setUsuarios]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalNuevo, setModalNuevo]   = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalOrg, setModalOrg]       = useState(false)
  const [filtro, setFiltro]           = useState('todos')

  const { areas, cargos, loading: loadingOrg, recargar: recargarOrg } = useAreasYCargos()

  const cargarUsuarios = () => {
    setLoading(true)
    usuariosAPI.getAll()
      .then(r => setUsuarios(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarUsuarios() }, [])

  const usuariosFiltrados = filtro === 'todos'
    ? usuarios
    : filtro === 'activos'
      ? usuarios.filter(u => u.activo)
      : usuarios.filter(u => !u.activo)

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>Usuarios</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {usuarios.length} {usuarios.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalOrg(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={{ backgroundColor: darkMode ? '#1F2937' : '#F3F4F6', color: text, border: `1px solid ${border}` }}>
            <Building2 size={15} /> Organización
          </button>
          <button onClick={() => setModalNuevo(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#6366F1' }}>
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { icon: <Building2 size={20} style={{ color: '#6366F1' }} />, label: 'Áreas',    val: areas.length },
          { icon: <Briefcase size={20} style={{ color: '#8B5CF6' }} />, label: 'Cargos',   val: cargos.length },
          { icon: <UserCheck size={20} style={{ color: '#22C55E' }} />, label: 'Activos',  val: usuarios.filter(u => u.activo).length },
          { icon: <UserX    size={20} style={{ color: '#EF4444' }} />, label: 'Inactivos', val: usuarios.filter(u => !u.activo).length },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
               style={{ backgroundColor: card, border: `1px solid ${border}` }}>
            {s.icon}
            <div>
              <p className="text-xs" style={{ color: sub }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: text }}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {['todos', 'activos', 'inactivos'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition"
                  style={{
                    backgroundColor: filtro === f ? '#6366F1' : card,
                    color: filtro === f ? '#fff' : sub,
                    border: `1px solid ${filtro === f ? '#6366F1' : border}`
                  }}>
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: sub }}>Cargando usuarios...</p>
      ) : (
        <>
          {/* TABLA — desktop */}
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#1F2937' : '#F9FAFB' }}>
                  {['Usuario', 'Correo', 'Área / Cargo', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, i) => (
                  <tr key={u.id} style={{
                    backgroundColor: i % 2 === 0 ? card : darkMode ? '#0F1923' : '#F9FAFB',
                    borderTop: `1px solid ${border}`
                  }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                             style={{ backgroundColor: '#6366F1' }}>
                          {u.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: text }}>{u.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: sub }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {u.area_nombre  && <p className="text-xs font-medium" style={{ color: text }}>{u.area_nombre}</p>}
                        {u.cargo_nombre && <p className="text-xs" style={{ color: sub }}>{u.cargo_nombre}</p>}
                        {!u.area_nombre && !u.cargo_nombre && <p className="text-xs" style={{ color: sub }}>—</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge text={ROL_LABEL[u.role] || u.role} colorClass={ROL_COLOR[u.role] || 'bg-gray-500/20 text-gray-300'} />
                    </td>
                    <td className="px-4 py-3">
                      {u.activo
                        ? <span className="flex items-center gap-1.5 text-xs text-green-400"><UserCheck size={14} /> Activo</span>
                        : <span className="flex items-center gap-1.5 text-xs text-red-400"><UserX size={14} /> Inactivo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setModalEditar(u)}
                              className="p-1.5 rounded-lg transition hover:opacity-80"
                              style={{ backgroundColor: darkMode ? '#1F2937' : '#F3F4F6' }}>
                        <Pencil size={14} style={{ color: '#6366F1' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuariosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: sub }}>No hay usuarios en este filtro.</p>
              </div>
            )}
          </div>

          {/* CARDS — móvil */}
          <div className="md:hidden space-y-3">
            {usuariosFiltrados.length === 0 && (
              <p className="text-center py-12 text-sm" style={{ color: sub }}>No hay usuarios en este filtro.</p>
            )}
            {usuariosFiltrados.map(u => (
              <div key={u.id} className="rounded-xl p-4 space-y-3"
                   style={{ backgroundColor: card, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                         style={{ backgroundColor: '#6366F1' }}>
                      {u.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: text }}>{u.nombre}</p>
                      <p className="text-xs" style={{ color: sub }}>{u.email}</p>
                      {(u.area_nombre || u.cargo_nombre) && (
                        <p className="text-xs mt-0.5" style={{ color: sub }}>
                          {[u.area_nombre, u.cargo_nombre].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setModalEditar(u)} className="p-2 rounded-lg"
                          style={{ backgroundColor: darkMode ? '#1F2937' : '#F3F4F6' }}>
                    <Pencil size={14} style={{ color: '#6366F1' }} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge text={ROL_LABEL[u.role] || u.role} colorClass={ROL_COLOR[u.role] || 'bg-gray-500/20 text-gray-300'} />
                  {u.activo
                    ? <span className="flex items-center gap-1 text-xs text-green-400"><UserCheck size={13} /> Activo</span>
                    : <span className="flex items-center gap-1 text-xs text-red-400"><UserX size={13} /> Inactivo</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOrg && (
        <ModalGestionarOrg darkMode={darkMode} onClose={() => setModalOrg(false)} onCambiado={recargarOrg} />
      )}
      {modalNuevo && (
        <ModalNuevoUsuario darkMode={darkMode} areas={areas} cargos={cargos} loadingOrg={loadingOrg}
                           onClose={() => setModalNuevo(false)} onCreado={cargarUsuarios} />
      )}
      {modalEditar && (
        <ModalEditarUsuario darkMode={darkMode} usuario={modalEditar} areas={areas} cargos={cargos}
                            loadingOrg={loadingOrg} onClose={() => setModalEditar(null)} onActualizado={cargarUsuarios} />
      )}
    </div>
  )
}