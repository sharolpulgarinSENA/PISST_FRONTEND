import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from './EmpleadoLayout'
import {
  User, Phone, Briefcase, Lock, Eye, EyeOff,
  Save, Camera, CheckCircle, X, Upload, Trash2,
  AlertCircle, Loader
} from 'lucide-react'
import api from '../services/api'

export default function EmpleadoPerfil() {
  const { user, login } = useAuth()
  const { tk, dark }    = useTema()

  const [tab, setTab] = useState('info') // 'info' | 'password'

  /* ── Perfil ── */
  const [perfil,    setPerfil]    = useState(null)
  const [cargando,  setCargando]  = useState(true)
  const [errorCarga,setErrorCarga]= useState(false)

  const [form, setForm] = useState({
    nombre:   user?.nombre   || '',
    telefono: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [guardado,  setGuardado]  = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  /* ── Foto ── */
  const [fotoURL,      setFotoURL]      = useState(null)
  const [fotoFile,     setFotoFile]     = useState(null)
  const [fotoError,    setFotoError]    = useState('')
  const [fotoHover,    setFotoHover]    = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoOk,       setFotoOk]       = useState(false)
  const inputFotoRef = useRef(null)

  /* ── Contraseña ── */
  const [pass,    setPass]    = useState({ actual: '', nueva: '', confirmar: '' })
  const [show,    setShow]    = useState({ actual: false, nueva: false, confirmar: false })
  const [errPass, setErrPass] = useState('')
  const [passOk,  setPassOk]  = useState(false)
  const [cambiando, setCambiando] = useState(false)

  /* ── Cargar perfil ── */
  useEffect(() => {
    api.get('/usuarios/me')
      .then(res => {
        const d = res.data
        setPerfil(d)
        setForm({ nombre: d.nombre || '', telefono: d.telefono || '' })
        setFotoURL(d.foto_url || null)
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false))
  }, [])

  /* ── Foto handlers ── */
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoError('')
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      setFotoError('Solo JPG, PNG o WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError('El archivo supera los 2MB.')
      return
    }
    setFotoFile(file)
    setFotoURL(URL.createObjectURL(file))
    if (e.target) e.target.value = ''
  }

  const subirFoto = async () => {
    if (!fotoFile) return
    setSubiendoFoto(true)
    setFotoError('')
    try {
      const fd = new FormData()
      fd.append('foto', fotoFile)
      const res = await api.post('/usuarios/me/foto', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFotoURL(res.data?.foto_url || fotoURL)
      setFotoFile(null)
      setFotoOk(true)
      setTimeout(() => setFotoOk(false), 2500)
    } catch {
      setFotoError('Error al subir la foto.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  /* ── Guardar perfil ── */
  const guardarPerfil = async () => {
    setGuardando(true)
    setErrorGuardar('')
    try {
      await api.patch('/usuarios/me', form)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } catch (err) {
      setErrorGuardar(err.response?.data?.detail || 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  /* ── Contraseña ── */
  const reglas = [
    { ok: pass.nueva.length >= 8,   label: 'Mínimo 8 caracteres'       },
    { ok: /\d/.test(pass.nueva),    label: 'Al menos 1 número'         },
    { ok: /[A-Z]/.test(pass.nueva), label: 'Al menos 1 letra mayúscula'},
  ]

  const actualizarPass = async () => {
    if (!pass.actual)                  { setErrPass('Ingresa tu contraseña actual'); return }
    if (pass.nueva.length < 8)         { setErrPass('Mínimo 8 caracteres'); return }
    if (!/\d/.test(pass.nueva))        { setErrPass('Al menos 1 número'); return }
    if (!/[A-Z]/.test(pass.nueva))     { setErrPass('Al menos 1 mayúscula'); return }
    if (pass.nueva !== pass.confirmar) { setErrPass('Las contraseñas no coinciden'); return }
    setErrPass('')
    setCambiando(true)
    try {
      await api.post('/auth/change-password', {
        current_password: pass.actual,
        new_password: pass.nueva
      })
      setPass({ actual: '', nueva: '', confirmar: '' })
      setPassOk(true)
      setTimeout(() => setPassOk(false), 3000)
    } catch (e) {
      setErrPass(e.response?.data?.detail || 'Error al actualizar contraseña')
    } finally {
      setCambiando(false)
    }
  }

  /* ── Estilos base ── */
  const card = {
    backgroundColor: tk.card,
    border: `1px solid ${tk.border}`,
    borderRadius: 12,
    padding: '24px',
  }

  const inputBase = {
    width: '100%', padding: '9px 12px',
    borderRadius: 8, border: `1px solid ${tk.border}`,
    backgroundColor: tk.bg, color: tk.text,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s'
  }

  const labelStyle = {
    fontSize: 12, color: tk.textMuted, fontWeight: 500,
    marginBottom: 5, display: 'block'
  }

  const sectionTitle = {
    fontSize: 14, fontWeight: 600, color: tk.text, marginBottom: 4
  }

  const sectionSub = {
    fontSize: 12, color: tk.textFaint, marginBottom: 20
  }

  const inicial = (form.nombre || user?.nombre || '?')[0]?.toUpperCase()

  return (
    <div style={{
      padding: '28px 32px', overflowY: 'auto',
      height: 'calc(100vh - 60px)', boxSizing: 'border-box',
      backgroundColor: tk.bg
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: tk.text, margin: 0 }}>Mi perfil</h1>
        <p style={{ fontSize: 13, color: tk.textFaint, margin: '4px 0 0' }}>
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── SIDEBAR TABS ── */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'info',     label: 'Información personal', icon: User },
            { id: 'password', label: 'Cambiar contraseña',   icon: Lock },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 9, border: 'none',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontSize: 13, fontWeight: active ? 600 : 400,
                backgroundColor: active ? '#6366F1' : 'transparent',
                color: active ? '#fff' : tk.textMuted,
                transition: 'all 0.15s'
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = tk.navHover }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Icon size={15} /> {label}
              </button>
            )
          })}
        </div>

        {/* ── CONTENIDO ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ──────── TAB: INFORMACIÓN PERSONAL ──────── */}
          {tab === 'info' && (
            <>
              {/* Foto de perfil */}
              <div style={card}>
                <div style={sectionTitle}>Foto de perfil</div>

                <input ref={inputFotoRef} type="file" accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFotoChange} style={{ display: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => inputFotoRef.current?.click()}
                    onMouseEnter={() => setFotoHover(true)}
                    onMouseLeave={() => setFotoHover(false)}
                  >
                    {fotoURL ? (
                      <img src={fotoURL} alt="Foto"
                        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${tk.border}` }} />
                    ) : (
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 700, color: '#fff',
                        border: `3px solid ${tk.border}`
                      }}>{inicial}</div>
                    )}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: fotoHover ? 1 : 0, transition: 'opacity 0.2s'
                    }}>
                      <Camera size={18} color="#fff" />
                    </div>
                  </div>

                  {/* Acciones foto */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button onClick={() => inputFotoRef.current?.click()} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
                        color: tk.textMuted, fontSize: 12, fontWeight: 500
                      }}>
                        <Camera size={13} /> Cambiar foto
                      </button>
                      {fotoFile && (
                        <button onClick={subirFoto} disabled={subiendoFoto} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          border: 'none',
                          background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                          color: '#fff', fontSize: 12, fontWeight: 600
                        }}>
                          {subiendoFoto
                            ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo...</>
                            : fotoOk
                              ? <><CheckCircle size={12} /> Guardada</>
                              : <><Upload size={12} /> Guardar foto</>
                          }
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: tk.textFaint }}>JPG, PNG o WEBP · Máx. 2MB</div>
                    {fotoError && (
                      <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertCircle size={12} /> {fotoError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos personales */}
              <div style={card}>
                <div style={sectionTitle}>Datos personales</div>
                <div style={sectionSub}>Actualiza tu nombre y número de contacto.</div>

                {cargando && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tk.textFaint, fontSize: 13, marginBottom: 16 }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando tu información...
                  </div>
                )}

                {errorCarga && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <AlertCircle size={14} />
                    No se pudo cargar tu información de perfil. Intenta recargar la página.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                  {/* Nombre */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Nombre completo</label>
                    <input type="text" value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      style={inputBase}
                      onFocus={e => e.target.style.borderColor = '#6366F1'}
                      onBlur={e => e.target.style.borderColor = tk.border}
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label style={labelStyle}>Número de teléfono</label>
                    <input type="tel" value={form.telefono} placeholder="+57 300 000 0000"
                      onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      style={inputBase}
                      onFocus={e => e.target.style.borderColor = '#6366F1'}
                      onBlur={e => e.target.style.borderColor = tk.border}
                    />
                  </div>

                  {/* Cargo — readonly */}
                  <div>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Briefcase size={12} /> Cargo
                    </label>
                    <input type="text"
                      value={perfil?.cargo?.nombre || '—'}
                      disabled
                      style={{ ...inputBase, color: tk.textFaint, cursor: 'not-allowed' }}
                    />
                    <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 4 }}>Asignado por el administrador</div>
                  </div>

                  {/* Correo — readonly */}
                  <div>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
                      Correo electrónico
                    </label>
                    <input type="email"
                      value={perfil?.email || user?.email || '—'}
                      disabled
                      style={{ ...inputBase, color: tk.textFaint, cursor: 'not-allowed' }}
                    />
                    <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 4 }}>
                      Para cambiar tu correo contacta al administrador.
                    </div>
                  </div>
                </div>

                {errorGuardar && (
                  <div style={{
                    marginTop: 14, padding: '9px 12px', borderRadius: 8,
                    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <AlertCircle size={13} /> {errorGuardar}
                  </div>
                )}

                <button onClick={guardarPerfil} disabled={guardando || cargando} style={{
                  marginTop: 20, padding: '10px 22px', borderRadius: 9, border: 'none',
                  background: guardado ? '#065F46' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                  opacity: guardando || cargando ? 0.7 : 1
                }}>
                  {guardando
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                    : guardado
                      ? <><CheckCircle size={14} /> Cambios guardados</>
                      : <><Save size={14} /> Guardar cambios</>
                  }
                </button>
              </div>
            </>
          )}

          {/* ──────── TAB: CONTRASEÑA ──────── */}
          {tab === 'password' && (
            <div style={card}>
              <div style={sectionTitle}>Cambiar contraseña</div>
              <div style={sectionSub}>Asegura tu cuenta con una contraseña fuerte.</div>

              <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'actual',    label: 'Contraseña actual',          ph: 'Tu contraseña actual'     },
                  { key: 'nueva',     label: 'Nueva contraseña',           ph: 'Mínimo 8 caracteres'      },
                  { key: 'confirmar', label: 'Confirmar nueva contraseña', ph: 'Repite tu nueva contraseña' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={show[key] ? 'text' : 'password'}
                        placeholder={ph}
                        value={pass[key]}
                        onChange={e => setPass(p => ({ ...p, [key]: e.target.value }))}
                        style={{ ...inputBase, paddingRight: 38 }}
                        onFocus={e => e.target.style.borderColor = '#6366F1'}
                        onBlur={e => e.target.style.borderColor = tk.border}
                      />
                      <button onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))} style={{
                        position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: tk.textFaint, padding: 0
                      }}>
                        {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Reglas */}
                {pass.nueva && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reglas.map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: r.ok ? 'rgba(34,197,94,0.15)' : tk.bg,
                          border: `1px solid ${r.ok ? '#22C55E' : tk.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {r.ok && <CheckCircle size={10} color="#22C55E" />}
                        </div>
                        <span style={{ color: r.ok ? '#22C55E' : tk.textFaint }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {errPass && (
                  <div style={{
                    padding: '9px 12px', borderRadius: 8,
                    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <AlertCircle size={13} /> {errPass}
                  </div>
                )}

                {passOk && (
                  <div style={{
                    padding: '9px 12px', borderRadius: 8,
                    backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    fontSize: 12, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                    <CheckCircle size={13} /> Contraseña actualizada exitosamente.
                  </div>
                )}

                <button onClick={actualizarPass} disabled={cambiando} style={{
                  padding: '10px 0', borderRadius: 9, border: 'none',
                  background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: cambiando ? 0.7 : 1, transition: 'opacity 0.2s'
                }}>
                  {cambiando
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Actualizando...</>
                    : 'Actualizar contraseña'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}