import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Check } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import pisstLogo from '../assets/imagenes/pisst_logo.png'
import googleLogo from '../assets/imagenes/google.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { usuariosAPI } from '../services/api'
import { ROLES } from '../constants/roles'

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(() => localStorage.getItem('pisst_remember') === 'true')
  const [form, setForm] = useState({
    email: localStorage.getItem('pisst_remember') === 'true' ? (localStorage.getItem('pisst_email') || '') : '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleHover, setGoogleHover] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaError, setCaptchaError] = useState(false)
  const captchaRef = useRef(null)
  const googleBtnRef = useRef(null)
  const navigate = useNavigate()
  const { login, updateUser } = useAuth()

  const completeLogin = useCallback(async ({ access_token, refresh_token, role, nombre, email, debe_cambiar_password }) => {
    const normalizedRole = role?.toString?.().toLowerCase?.()
    login(access_token, refresh_token, { role: normalizedRole, nombre, email })

    try {
      const { data } = await usuariosAPI.getMe()
      updateUser({ foto_url: data?.foto_url || null, id: data?.id || null })
    } catch {
      // si falla, el avatar mostrará las iniciales y se cargará al visitar Perfil
    }

    if (debe_cambiar_password) {
      sessionStorage.setItem('pisst_debe_cambiar_password', 'true')
      navigate('/cambiar-password')
      return
    }

    sessionStorage.removeItem('pisst_debe_cambiar_password')

    if (normalizedRole === ROLES.SST || normalizedRole === ROLES.GERENCIA) navigate('/dashboard')
    else if (normalizedRole === ROLES.EMPLEADO) navigate('/empleado/chat')
    else navigate('/chat')
  }, [login, updateUser, navigate])

  async function handleLogin() {
    if (!form.email || !form.password) { setError('Por favor completa todos los campos'); return }
    if (!captchaToken) { setError('Por favor completa el reCAPTCHA.'); return }
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
        recaptcha_token: captchaToken,
      })

      if (remember) { localStorage.setItem('pisst_remember', 'true'); localStorage.setItem('pisst_email', form.email) }
      else { localStorage.removeItem('pisst_remember'); localStorage.removeItem('pisst_email') }

      await completeLogin({ ...response.data, email: form.email })
    } catch (err) {
      const status  = err.response?.status
      const detalle = err.response?.data?.detail
      if (status === 429) setError('Demasiados intentos. Intenta más tarde.')
      else setError(typeof detalle === 'string' ? detalle : 'Correo o contraseña incorrectos')
      captchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = useCallback(async (response) => {
    setError('')
    setGoogleLoading(true)
    try {
      const res = await api.post('/auth/google', { credential: response.credential })
      await completeLogin(res.data)
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo iniciar sesión con Google')
    } finally {
      setGoogleLoading(false)
    }
  }, [completeLogin])

  useEffect(() => {
    let cancelled = false
    const tryInit = () => {
      if (cancelled) return
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        })
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            width: 300,
          })
        }
      } else {
        setTimeout(tryInit, 100)
      }
    }
    tryInit()
    return () => { cancelled = true }
  }, [handleGoogleCredential])

  return (
    <div className="min-h-screen overflow-hidden flex items-center justify-center relative" style={{ background: '#05070D' }}>
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Volver al inicio"
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200"
        style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
      >
        <ArrowLeft size={18} />
      </button>

      <div
        className="relative w-[92vw] h-[92vw] max-w-[560px] max-h-[560px] rounded-full flex items-center justify-center px-6"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #131820 0%, #0c1018 40%, #070a10 70%, #05070D 100%)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.03), 0 -20px 60px rgba(255,255,255,0.04), 20px 0 60px rgba(255,255,255,0.02), -20px 0 60px rgba(255,255,255,0.02), 0 30px 80px rgba(0,0,0,0.8)',
        }}
      >
        <div className="w-full max-w-[300px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <img src={pisstLogo} alt="Logo de PISST" className="w-28 mx-auto mb-6 object-contain" />
          <p
            className="text-center text-xs uppercase tracking-widest mb-7"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Iniciar sesión
          </p>

          <div className="mb-5">
            <label htmlFor="login-email" className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Correo electrónico
            </label>
            <div className="flex items-center gap-2">
              <Mail size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@pisst.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-transparent border-0 border-b py-2 text-sm outline-none transition-colors duration-200"
                style={{ borderBottomColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="login-password" className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Contraseña
            </label>
            <div className="flex items-center gap-2">
              <Lock size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Tu contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-transparent border-0 border-b py-2 text-sm outline-none transition-colors duration-200"
                style={{ borderBottomColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.12)')}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="flex-shrink-0 transition-opacity hover:opacity-70 focus:outline-none"
              >
                {showPass ? <EyeOff size={15} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <Eye size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 mb-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-white/70"
              />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Recordarme</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="text-xs transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="flex justify-center mb-3" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              hl="es"
              theme="dark"
              onChange={(token) => { setCaptchaToken(token); setCaptchaError(false); setError('') }}
              onExpired={() => setCaptchaToken(null)}
              onErrored={() => setCaptchaError(true)}
            />
          </div>
          {captchaError && (
            <p className="text-xs text-center mb-3" style={{ color: '#EF4444' }}>
              No se pudo cargar la verificación de seguridad. Recarga la página o desactiva los bloqueadores de anuncios para continuar.
            </p>
          )}

          {error && (
            <p className="text-red-400 text-xs text-center mb-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !captchaToken}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm tracking-widest uppercase font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => { if (!loading && captchaToken) { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Iniciar sesión'}
          </button>

          <div className="flex items-center gap-3 mt-5 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <div className="relative w-full">
            <div
              className="w-full py-3 rounded-lg flex items-center justify-center gap-3 text-sm pointer-events-none transition-colors duration-200"
              style={{
                background: googleHover ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: `1px solid ${googleHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)'}`,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {googleLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <img src={googleLogo} alt="Logo de Google" className="w-4 h-4" />
                  Continuar con Google
                </>
              )}
            </div>
            <div
              ref={googleBtnRef}
              className="absolute inset-0 overflow-hidden rounded-lg"
              style={{ opacity: 0.01 }}
              onMouseEnter={() => setGoogleHover(true)}
              onMouseLeave={() => setGoogleHover(false)}
            />
          </div>

          <div className="flex justify-center mt-7 pointer-events-none">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Check size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
