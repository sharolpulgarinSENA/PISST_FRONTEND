import { useState, useEffect, useMemo, useRef } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import {
  User, Camera, Mail, Briefcase, Lock, Eye, EyeOff, Check, X, Loader2, History,
} from 'lucide-react'
import { usuariosAPI, authAPI, getErrorMessage } from '../../../services/api'
import { normFecha, fmtFecha } from '../../../utils/dates'
import { useAuth } from '../../../context/AuthContext'

const REQUISITOS = [
  { id: 'longitud',  label: 'Mínimo 8 caracteres',                            test: (p) => p.length >= 8 },
  { id: 'mayuscula', label: 'Al menos una mayúscula',                         test: (p) => /[A-Z]/.test(p) },
  { id: 'simbolo',   label: 'Al menos un símbolo (!@#$%^&*(),.?":{}|<>_-)',   test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p) },
]

const FOTO_FORMATOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 2 * 1024 * 1024
const ACTIVIDAD_LIMIT = 10

const ERRORES_TECNICOS = [
  [/value is not a valid email/i,              'El correo electrónico no es válido.'],
  [/string too short/i,                        'El texto ingresado es demasiado corto.'],
  [/string too long/i,                         'El texto ingresado es demasiado largo.'],
  [/value is not a valid integer/i,            'Debes ingresar un número entero.'],
  [/none is not an allowed value/i,            'Este campo es obligatorio.'],
  [/field required/i,                          'Este campo es obligatorio.'],
  [/ensure this value has at least/i,          'El valor no cumple el mínimo requerido.'],
  [/incorrect.*password|password.*incorrect/i, 'La contraseña actual es incorrecta.'],
  [/not enough characters/i,                   'La contraseña es demasiado corta.'],
]

function sanitizarError(msg) {
  if (!msg) return msg
  for (const [pattern, replacement] of ERRORES_TECNICOS) {
    if (pattern.test(msg)) return replacement
  }
  return msg
}

function iniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase()
}

function campoActividad(reg, candidatos) {
  for (const c of candidatos) {
    if (reg[c] !== undefined && reg[c] !== null && reg[c] !== '') return reg[c]
  }
  return null
}

/* ──────────────────────────────────────────
   Subcomponentes FUERA del padre
─────────────────────────────────────────── */
function CampoPassword({ label, value, onChange, mostrar, onToggle, theme }) {
  const { sub, border, input, text } = theme
  return (
    <div className="mb-4">
      <label className="block text-xs mb-1.5" style={{ color: sub }}>{label}</label>
      <div className="relative">
        <input
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none"
          style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: sub }}
        >
          {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function Banner({ type, children }) {
  const ok = type === 'ok'
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm mb-3"
      style={{
        backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: ok ? '#22C55E' : '#F87171',
      }}
    >
      {children}
    </div>
  )
}

/* ──────────────────────────────────────────
   Componente principal
─────────────────────────────────────────── */
export default function PerfilSST() {
  const { darkMode } = useTheme()
  const { updateUser } = useAuth()

  const bg     = darkMode ? '#0B0F19' : '#F9FAFB'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [infoMsg, setInfoMsg] = useState(null)

  // Foto
  const fileInputRef = useRef(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoMsg, setFotoMsg] = useState(null)

  // Contraseña
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [pwShow, setPwShow] = useState({ actual: false, nueva: false, confirmar: false })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  // Actividad
  const [actividad, setActividad] = useState([])
  const [actTotal, setActTotal] = useState(0)
  const [actOffset, setActOffset] = useState(0)
  const [actLoading, setActLoading] = useState(true)
  const [actLoadingMore, setActLoadingMore] = useState(false)

  useEffect(() => {
    cargarPerfil()
    cargarActividad(0, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarPerfil() {
    setLoading(true)
    try {
      const { data } = await usuariosAPI.getMe()
      setPerfil(data)
      setForm({ nombre: data.nombre || '', telefono: data.telefono || '' })
      updateUser({ foto_url: data?.foto_url || null })
    } catch {
      setInfoMsg({ type: 'error', text: 'No se pudo cargar tu información de perfil. Intenta recargar la página.' })
    } finally {
      setLoading(false)
    }
  }

  async function cargarActividad(offset, append) {
    if (append) setActLoadingMore(true)
    else setActLoading(true)
    try {
      const { data } = await usuariosAPI.getActividad(ACTIVIDAD_LIMIT, offset)
      const nuevos = data.registros || []
      setActividad((prev) => (append ? [...prev, ...nuevos] : nuevos))
      setActTotal(data.total || 0)
      setActOffset(offset)
    } catch {
      // silencioso: la sección de actividad no es crítica
    } finally {
      if (append) setActLoadingMore(false)
      else setActLoading(false)
    }
  }

  function verMasActividad() {
    cargarActividad(actOffset + ACTIVIDAD_LIMIT, true)
  }

  async function guardarInfo() {
    setInfoMsg(null)
    if (!form.nombre.trim()) {
      setInfoMsg({ type: 'error', text: 'El nombre no puede estar vacío.' })
      return
    }
    setGuardando(true)
    try {
      const { data } = await usuariosAPI.updateMe({ nombre: form.nombre.trim(), telefono: form.telefono.trim() })
      setPerfil((p) => ({ ...p, ...data }))
      updateUser({ nombre: data?.nombre ?? form.nombre.trim() })
      setInfoMsg({ type: 'ok', text: 'Cambios guardados correctamente.' })
    } catch (err) {
      setInfoMsg({ type: 'error', text: sanitizarError(getErrorMessage(err, null)) || 'No se pudieron guardar los cambios.' })
    } finally {
      setGuardando(false)
    }
  }

  function seleccionarFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoMsg(null)
    if (!FOTO_FORMATOS.includes(file.type)) {
      setFotoMsg({ type: 'error', text: 'Formato no válido. Usa JPG, PNG o WEBP.' })
      return
    }
    if (file.size > FOTO_MAX_BYTES) {
      setFotoMsg({ type: 'error', text: 'La imagen supera el tamaño máximo de 2MB.' })
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function cancelarFoto() {
    setFotoFile(null)
    setFotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function confirmarFoto() {
    if (!fotoFile) return
    setSubiendoFoto(true)
    setFotoMsg(null)
    try {
      const formData = new FormData()
      formData.append('foto', fotoFile)
      const { data } = await usuariosAPI.updateFoto(formData)
      const fotoUrl = data?.foto_url || data?.url || null
      setPerfil((p) => ({ ...p, foto_url: fotoUrl || p.foto_url }))
      updateUser({ foto_url: fotoUrl })
      setFotoMsg({ type: 'ok', text: 'Foto actualizada correctamente.' })
      cancelarFoto()
    } catch (err) {
      setFotoMsg({ type: 'error', text: sanitizarError(getErrorMessage(err, null)) || 'No se pudo actualizar la foto.' })
    } finally {
      setSubiendoFoto(false)
    }
  }

  const pwChecks = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.test(pwForm.nueva) })),
    [pwForm.nueva]
  )
  const pwCumple   = pwChecks.every((c) => c.ok)
  const pwCoincide = pwForm.nueva.length > 0 && pwForm.nueva === pwForm.confirmar
  const pwValido   = pwForm.actual.length > 0 && pwCumple && pwCoincide

  async function cambiarPassword() {
    setPwMsg(null)
    if (!pwValido) {
      if (!pwCumple) setPwMsg({ type: 'error', text: 'La nueva contraseña no cumple con los requisitos.' })
      else if (!pwCoincide) setPwMsg({ type: 'error', text: 'Las contraseñas no coinciden.' })
      else setPwMsg({ type: 'error', text: 'Completa todos los campos.' })
      return
    }
    setPwLoading(true)
    try {
      await authAPI.cambiarPassword({ password_actual: pwForm.actual, nueva_password: pwForm.nueva })
      setPwMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
      setPwForm({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: sanitizarError(getErrorMessage(err, null)) || 'No se pudo cambiar la contraseña.' })
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6" style={{ backgroundColor: bg }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#6366F1' }} />
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-8" style={{ backgroundColor: bg }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: text }}>Mi perfil</h1>
        <p className="text-sm mt-0.5" style={{ color: sub }}>Gestiona tu información personal y seguridad</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs laterales */}
        <div className="flex lg:flex-col gap-2 lg:w-56 shrink-0">
          <button
            onClick={() => setTab('info')}
            className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{
              backgroundColor: tab === 'info' ? '#6366F1' : card,
              color: tab === 'info' ? '#fff' : text,
              border: `1px solid ${tab === 'info' ? '#6366F1' : border}`,
            }}
          >
            <User size={16} /> Información personal
          </button>
          <button
            onClick={() => setTab('password')}
            className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{
              backgroundColor: tab === 'password' ? '#6366F1' : card,
              color: tab === 'password' ? '#fff' : text,
              border: `1px solid ${tab === 'password' ? '#6366F1' : border}`,
            }}
          >
            <Lock size={16} /> Cambiar contraseña
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {tab === 'info' ? (
            <div className="space-y-6">
              {/* Foto de perfil */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: text }}>Foto de perfil</h2>
                {fotoMsg && <Banner type={fotoMsg.type}>{fotoMsg.text}</Banner>}
                <div className="flex items-center gap-4 flex-wrap">
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ backgroundColor: input, border: `1px solid ${border}` }}
                  >
                    {fotoPreview || perfil?.foto_url ? (
                      <img src={fotoPreview || perfil.foto_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold" style={{ color: '#6366F1' }}>{iniciales(perfil?.nombre)}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={seleccionarFoto}
                      className="hidden"
                    />
                    {!fotoFile ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
                      >
                        <Camera size={14} /> Cambiar foto
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={confirmarFoto}
                          disabled={subiendoFoto}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                          style={{ backgroundColor: '#6366F1' }}
                        >
                          {subiendoFoto ? 'Subiendo...' : 'Confirmar'}
                        </button>
                        <button
                          onClick={cancelarFoto}
                          disabled={subiendoFoto}
                          className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                          style={{ color: sub, border: `1px solid ${border}` }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <p className="text-xs" style={{ color: sub }}>JPG, PNG o WEBP · Máx. 2MB</p>
                  </div>
                </div>
              </div>

              {/* Datos personales */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: text }}>Datos personales</h2>
                {infoMsg && <Banner type={infoMsg.type}>{infoMsg.text}</Banner>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: sub }}>Nombre completo</label>
                    <input
                      value={form.nombre}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: sub }}>Número de teléfono</label>
                    <input
                      value={form.telefono}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: sub }}>
                        <Briefcase size={12} /> Cargo
                      </label>
                      <div className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: input, color: sub, border: `1px solid ${border}` }}>
                        {perfil?.cargo_nombre || '—'}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: sub }}>Asignado por el administrador</p>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: sub }}>
                        <Mail size={12} /> Correo electrónico
                      </label>
                      <div className="w-full rounded-lg px-3 py-2 text-sm truncate" style={{ backgroundColor: input, color: sub, border: `1px solid ${border}` }}>
                        {perfil?.email || '—'}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: sub }}>Para cambiar tu correo contacta al administrador.</p>
                    </div>
                  </div>
                  <button
                    onClick={guardarInfo}
                    disabled={guardando}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#6366F1' }}
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 max-w-md" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: text }}>Cambiar contraseña</h2>
              {pwMsg && <Banner type={pwMsg.type}>{pwMsg.text}</Banner>}

              <CampoPassword
                label="Contraseña actual"
                value={pwForm.actual}
                onChange={(e) => setPwForm((f) => ({ ...f, actual: e.target.value }))}
                mostrar={pwShow.actual}
                onToggle={() => setPwShow((s) => ({ ...s, actual: !s.actual }))}
                theme={{ sub, border, input, text }}
              />
              <CampoPassword
                label="Nueva contraseña"
                value={pwForm.nueva}
                onChange={(e) => setPwForm((f) => ({ ...f, nueva: e.target.value }))}
                mostrar={pwShow.nueva}
                onToggle={() => setPwShow((s) => ({ ...s, nueva: !s.nueva }))}
                theme={{ sub, border, input, text }}
              />
              <CampoPassword
                label="Confirmar nueva contraseña"
                value={pwForm.confirmar}
                onChange={(e) => setPwForm((f) => ({ ...f, confirmar: e.target.value }))}
                mostrar={pwShow.confirmar}
                onToggle={() => setPwShow((s) => ({ ...s, confirmar: !s.confirmar }))}
                theme={{ sub, border, input, text }}
              />

              <div className="rounded-lg p-3 mb-4 space-y-1" style={{ backgroundColor: input }}>
                {pwChecks.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs" style={{ color: c.ok ? '#22C55E' : sub }}>
                    {c.ok ? <Check size={14} /> : <X size={14} className="opacity-50" />}
                    {c.label}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs" style={{ color: pwCoincide ? '#22C55E' : sub }}>
                  {pwCoincide ? <Check size={14} /> : <X size={14} className="opacity-50" />}
                  Las contraseñas coinciden
                </div>
              </div>

              <button
                onClick={cambiarPassword}
                disabled={pwLoading || !pwValido}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#6366F1' }}
              >
                {pwLoading ? 'Guardando...' : 'Actualizar contraseña'}
              </button>

              {!pwLoading && !pwValido && (
                <p className="text-xs text-center mt-2" style={{ color: sub }}>
                  {!pwForm.actual.length
                    ? 'Ingresa tu contraseña actual para continuar.'
                    : !pwCumple
                      ? 'La nueva contraseña no cumple todos los requisitos.'
                      : 'Las contraseñas nuevas no coinciden.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <History size={16} style={{ color: '#6366F1' }} />
          <h2 className="text-sm font-semibold" style={{ color: text }}>Actividad reciente</h2>
        </div>

        {actLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={22} style={{ color: '#6366F1' }} />
          </div>
        ) : actividad.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: sub }}>No hay actividad registrada.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {actividad.map((reg, i) => (
                <div key={reg.id ?? i} className="rounded-xl p-3 text-sm" style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium" style={{ color: text }}>
                      {campoActividad(reg, ['accion', 'action', 'tipo_accion', 'evento']) || '—'}
                    </span>
                    <span className="text-xs whitespace-nowrap" style={{ color: sub }}>
                      {fmtFecha(campoActividad(reg, ['fecha', 'created_at', 'fecha_hora', 'timestamp', 'fecha_evento']))}
                    </span>
                  </div>
                  <div className="text-xs mb-0.5" style={{ color: sub }}>
                    {campoActividad(reg, ['modulo', 'module']) || '—'}
                  </div>
                  <div className="text-xs" style={{ color: sub }}>
                    {campoActividad(reg, ['detalle', 'descripcion', 'description', 'mensaje']) || '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm" style={{ minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: sub }}>Acción</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: sub }}>Módulo</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: sub }}>Detalle</th>
                    <th className="text-left py-2 text-xs font-semibold" style={{ color: sub }}>Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {actividad.map((reg, i) => (
                    <tr key={reg.id ?? i} style={{ borderBottom: `1px solid ${border}` }}>
                      <td className="py-2 pr-4" style={{ color: text }}>
                        {campoActividad(reg, ['accion', 'action', 'tipo_accion', 'evento']) || '—'}
                      </td>
                      <td className="py-2 pr-4" style={{ color: text }}>
                        {campoActividad(reg, ['modulo', 'module']) || '—'}
                      </td>
                      <td className="py-2 pr-4" style={{ color: sub }}>
                        {campoActividad(reg, ['detalle', 'descripcion', 'description', 'mensaje']) || '—'}
                      </td>
                      <td className="py-2 whitespace-nowrap" style={{ color: sub }}>
                        {fmtFecha(campoActividad(reg, ['fecha', 'created_at', 'fecha_hora', 'timestamp', 'fecha_evento']))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {actividad.length < actTotal && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={verMasActividad}
                  disabled={actLoadingMore}
                  className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
                >
                  {actLoadingMore ? 'Cargando...' : 'Ver más actividades'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
