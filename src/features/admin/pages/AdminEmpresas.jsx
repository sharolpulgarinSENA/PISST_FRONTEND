import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { Plus, X, Building2, UserPlus, CheckCircle2 } from 'lucide-react'
import { adminAPI, getErrorMessage } from '../../../services/api'
import { useModal } from '../../../hooks/useModal'
import { usePaginacion } from '../../../hooks/usePaginacion'
import Paginador from '../../../components/Paginador'
import Spinner from '../../../components/Spinner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{text}</span>
}

/* ══════════════════════════════════════════
   MODAL: CREAR EMPRESA
══════════════════════════════════════════ */
function ModalCrearEmpresa({ darkMode, onClose, onCreada }) {
  const dialogRef = useModal(onClose)
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]       = useState({ nombre: '', nit: '', sector: '', ciudad: '', direccion: '', telefono: '' })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = true
    if (!form.nit.trim())    e.nit    = true
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBanner('Por favor, diligencia los campos obligatorios.'); return }
    setBanner('')
    setLoading(true)
    try {
      const { data } = await adminAPI.crearEmpresa({
        nombre:    form.nombre.trim(),
        nit:       form.nit.trim(),
        sector:    form.sector.trim()    || undefined,
        ciudad:    form.ciudad.trim()    || undefined,
        direccion: form.direccion.trim() || undefined,
        telefono:  form.telefono.trim()  || undefined,
      })
      onCreada(data)
      onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, 'Error al crear la empresa.'))
    } finally { setLoading(false) }
  }

  const inputCls = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-crear-empresa-title"
           className="w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: border }}>
          <h2 id="modal-crear-empresa-title" className="font-bold text-lg" style={{ color: text }}>Crear empresa</h2>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {banner && (
            <div className="text-sm rounded-lg px-4 py-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {banner}
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Nombre *</label>
            <input type="text" placeholder="Nombre de la empresa" value={form.nombre}
                   onChange={e => { set('nombre', e.target.value); setErrores(p => ({ ...p, nombre: false })) }}
                   className={inputCls('nombre')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>NIT *</label>
            <input type="text" placeholder="900123456-7" value={form.nit}
                   onChange={e => { set('nit', e.target.value); setErrores(p => ({ ...p, nit: false })) }}
                   className={inputCls('nit')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Sector</label>
              <input type="text" placeholder="Opcional" value={form.sector}
                     onChange={e => set('sector', e.target.value)}
                     className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                     style={{ backgroundColor: input, color: text }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Ciudad</label>
              <input type="text" placeholder="Opcional" value={form.ciudad}
                     onChange={e => set('ciudad', e.target.value)}
                     className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                     style={{ backgroundColor: input, color: text }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Dirección</label>
            <input type="text" placeholder="Opcional" value={form.direccion}
                   onChange={e => set('direccion', e.target.value)}
                   className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                   style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Teléfono</label>
            <input type="text" placeholder="Opcional" value={form.telefono}
                   onChange={e => set('telefono', e.target.value)}
                   className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent"
                   style={{ backgroundColor: input, color: text }} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Creando...' : 'Crear empresa'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: ASIGNAR USUARIO (SST o GERENCIA)
══════════════════════════════════════════ */
function ModalAsignarUsuario({ darkMode, rol, empresa, onClose, onCreado }) {
  const dialogRef = useModal(onClose)
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const esGerencia = rol === 'gerencia'
  const titulo = esGerencia ? 'Asignar Gerencia' : 'Asignar SST'

  const [form, setForm]       = useState({ nombre: '', email: '' })
  const [errores, setErrores] = useState({})
  const [banner, setBanner]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = true
    if (!form.email.trim())  e.email  = true
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'formato'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBanner('Por favor, diligencia los campos obligatorios.'); return }
    setBanner('')
    setLoading(true)
    try {
      const payload = { nombre: form.nombre.trim(), email: form.email.trim(), empresa_id: empresa.id }
      const crear = esGerencia ? adminAPI.crearGerencia : adminAPI.crearSST
      await crear(payload)
      onCreado(`Usuario ${esGerencia ? 'Gerencia' : 'SST'} creado. Se envió contraseña temporal a ${form.email.trim()}.`)
      onClose()
    } catch (err) {
      setBanner(getErrorMessage(err, `Error al crear el usuario ${esGerencia ? 'Gerencia' : 'SST'}.`))
    } finally { setLoading(false) }
  }

  const inputCls = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-asignar-usuario-title"
           className="w-full max-w-md rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 id="modal-asignar-usuario-title" className="font-bold text-lg" style={{ color: text }}>{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {banner && (
            <div className="text-sm rounded-lg px-4 py-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {banner}
            </div>
          )}

          <div className="rounded-lg px-4 py-3 text-xs flex items-center gap-2" style={{ backgroundColor: input, color: sub }}>
            <Building2 size={14} className="shrink-0" /> Empresa: <strong style={{ color: text }}>{empresa.nombre}</strong>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Nombre completo *</label>
            <input type="text" placeholder="Nombre del usuario" value={form.nombre}
                   onChange={e => { set('nombre', e.target.value); setErrores(p => ({ ...p, nombre: false })) }}
                   className={inputCls('nombre')} style={{ backgroundColor: input, color: text }} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Correo electrónico *</label>
            <input type="email" placeholder="correo@empresa.com" value={form.email}
                   onChange={e => { set('email', e.target.value); setErrores(p => ({ ...p, email: false })) }}
                   className={inputCls('email')} style={{ backgroundColor: input, color: text }} />
            {errores.email === 'formato' && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Ingresa un correo electrónico válido.</p>
            )}
            {errores.email === true && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }}>El correo electrónico es obligatorio.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Creando...' : `Crear ${esGerencia ? 'Gerencia' : 'SST'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA: ADMIN EMPRESAS
══════════════════════════════════════════ */
export default function AdminEmpresas() {
  const { darkMode } = useTheme()
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'

  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [modalCrear, setModalCrear]     = useState(false)
  const [modalUsuario, setModalUsuario] = useState(null) // { rol: 'sst'|'gerencia', empresa }
  const [recienCreada, setRecienCreada] = useState(null) // empresa devuelta por el POST, para ofrecer asignar usuarios
  const [okMsg, setOkMsg]               = useState('')

  const cargar = () => {
    setLoading(true)
    setError('')
    adminAPI.getEmpresas()
      .then(({ data }) => setEmpresas(Array.isArray(data) ? data : []))
      .catch(err => setError(getErrorMessage(err, 'No se pudieron cargar las empresas.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const showOk = (msg) => {
    setOkMsg(msg)
    setTimeout(() => setOkMsg(''), 4000)
  }

  const { paginaItems: empresasPagina, pagina, totalPaginas, setPagina } = usePaginacion(empresas)

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ background: 'transparent' }}>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-bold text-xl" style={{ color: text }}>Empresas</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>Crea empresas y asigna sus usuarios SST o Gerencia.</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#6366F1' }}
        >
          <Plus size={16} /> Crear empresa
        </button>
      </div>

      {okMsg && (
        <div className="text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2"
             style={{ backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${darkMode ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, color: darkMode ? '#86EFAC' : '#15803D' }}>
          <CheckCircle2 size={16} className="shrink-0" /> {okMsg}
        </div>
      )}

      {recienCreada && (
        <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap"
             style={{ backgroundColor: card, border: '1px solid #6366F1' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <Building2 size={18} style={{ color: '#818CF8' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: text }}>
                Empresa "{recienCreada.nombre}" creada
              </p>
              <p className="text-xs truncate" style={{ color: sub }}>ID: {recienCreada.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setModalUsuario({ rol: 'sst', empresa: recienCreada })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#6366F1' }}>
              <UserPlus size={13} /> Asignar SST
            </button>
            <button onClick={() => setModalUsuario({ rol: 'gerencia', empresa: recienCreada })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#9333EA' }}>
              <UserPlus size={13} /> Asignar Gerencia
            </button>
            <button onClick={() => setRecienCreada(null)} aria-label="Cerrar" style={{ color: sub }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm rounded-lg px-4 py-3 mb-4"
             style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : empresas.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          <Building2 size={32} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>Todavía no hay empresas registradas.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: sub }}>Nombre</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: sub }}>NIT</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: sub }}>Sector</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: sub }}>Estado</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: sub }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresasPagina.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td className="px-4 py-3" style={{ color: text }}>{emp.nombre}</td>
                      <td className="px-4 py-3" style={{ color: sub }}>{emp.nit}</td>
                      <td className="px-4 py-3" style={{ color: sub }}>{emp.sector || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          text={emp.activo === false ? 'Inactivo' : 'Activo'}
                          colorClass={emp.activo === false ? 'bg-gray-500/20 text-gray-300' : 'bg-green-500/20 text-green-300'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button onClick={() => setModalUsuario({ rol: 'sst', empresa: emp })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                  style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                            <UserPlus size={12} /> SST
                          </button>
                          <button onClick={() => setModalUsuario({ rol: 'gerencia', empresa: emp })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                  style={{ backgroundColor: 'rgba(147,51,234,0.12)', color: '#C084FC' }}>
                            <UserPlus size={12} /> Gerencia
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} darkMode={darkMode} />
        </>
      )}

      {modalCrear && (
        <ModalCrearEmpresa
          darkMode={darkMode}
          onClose={() => setModalCrear(false)}
          onCreada={(empresa) => { setRecienCreada(empresa); cargar(); showOk('Empresa creada correctamente.') }}
        />
      )}

      {modalUsuario && (
        <ModalAsignarUsuario
          darkMode={darkMode}
          rol={modalUsuario.rol}
          empresa={modalUsuario.empresa}
          onClose={() => setModalUsuario(null)}
          onCreado={(msg) => showOk(msg)}
        />
      )}
    </div>
  )
}
