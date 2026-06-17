import { Mail, Lock, Eye, EyeOff, Shield, BarChart2, Users, Globe, Sun, Moon, ChevronDown, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import logoClaro from '../assets/imagenes/pisst_logo.png'                       // logo claro → fondo oscuro
import logoOscuro from '../assets/imagenes/logopisstCLaro-removebg-preview.png' // logo oscuro → fondo claro
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api, { usuariosAPI } from '../services/api'
import { ROLES } from '../constants/roles'

/* ══════════════════════════════════════════
   TRADUCCIONES (i18n simple, sin librería)
══════════════════════════════════════════ */
const T = {
  es: {
    langName: 'Español',
    heroTitle1: 'Plataforma integral SST',
    heroTitle2: 'Potenciadora de procesos',
    heroDesc: 'PISST centraliza la gestión de procesos SG-SST en un solo lugar, con herramientas seguras, intuitivas y diseñadas para equipos de alto rendimiento.',
    features: [
      { titulo: 'Seguridad y privacidad',   desc: 'Protección de datos médicos con cifrado de extremo a extremo y cumplimiento normativo.' },
      { titulo: 'Gestión inteligente',      desc: 'Automatiza procesos y optimiza recursos con análisis predictivo en tiempo real.' },
      { titulo: 'Colaboración sin límites', desc: 'Coordina equipos multidisciplinarios con comunicación fluida y acceso compartido.' },
    ],
    quote: '"Tecnología que cuida, gestión que transforma."',
    welcome: 'Bienvenido de nuevo',
    welcomeSub: 'Inicia sesión para continuar en tu cuenta',
    email: 'Correo electrónico',
    emailPh: 'tu@pisst.com',
    password: 'Contraseña',
    passwordPh: 'Tu contraseña',
    remember: 'Recordarme',
    forgot: '¿Olvidaste tu contraseña?',
    signin: 'Iniciar sesión',
    or: 'o continúa con',
    noAccount: '¿No tienes una cuenta?',
    requestAccess: 'Solicita acceso',
    fillFields: 'Por favor completa todos los campos',
    captchaRequired: 'Por favor completa el reCAPTCHA.',
    tooMany: 'Demasiados intentos. Intenta más tarde.',
    loginError: 'Correo o contraseña incorrectos',
    rights: '© 2026 PISST. Todos los derechos reservados.',
    privacy: 'Privacidad',
    terms: 'Términos',
  },
  en: {
    langName: 'English',
    heroTitle1: 'Integrated OHS platform',
    heroTitle2: 'Empowering your processes',
    heroDesc: 'PISST centralizes OHS management in a single place, with secure, intuitive tools designed for high-performance teams.',
    features: [
      { titulo: 'Security & privacy',      desc: 'Medical data protection with end-to-end encryption and regulatory compliance.' },
      { titulo: 'Smart management',         desc: 'Automate processes and optimize resources with real-time predictive analytics.' },
      { titulo: 'Limitless collaboration',  desc: 'Coordinate multidisciplinary teams with smooth communication and shared access.' },
    ],
    quote: '"Technology that cares, management that transforms."',
    welcome: 'Welcome back',
    welcomeSub: 'Sign in to continue to your account',
    email: 'Email address',
    emailPh: 'you@pisst.com',
    password: 'Password',
    passwordPh: 'Your password',
    remember: 'Remember me',
    forgot: 'Forgot your password?',
    signin: 'Sign in',
    or: 'or continue with',
    noAccount: "Don't have an account?",
    requestAccess: 'Request access',
    fillFields: 'Please fill in all fields',
    captchaRequired: 'Please complete the reCAPTCHA.',
    tooMany: 'Too many attempts. Try again later.',
    loginError: 'Incorrect email or password',
    rights: '© 2026 PISST. All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
  },
}

const IDIOMAS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(() => localStorage.getItem('pisst_remember') === 'true')
  const [form, setForm] = useState({ email: localStorage.getItem('pisst_remember') === 'true' ? (localStorage.getItem('pisst_email') || '') : '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaError, setCaptchaError] = useState(false)
  const captchaRef = useRef(null)
  const navigate = useNavigate()
  const { login, updateUser } = useAuth()

  // Tema global (persistido y compartido con toda la app)
  const { darkMode: dark, setDarkMode: setDark } = useTheme()

  // Idioma (persistido)
  const [lang, setLang] = useState(() => localStorage.getItem('pisst_lang') || 'es')
  useEffect(() => { localStorage.setItem('pisst_lang', lang) }, [lang])
  const t = T[lang]

  // Dropdown idioma
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const logo = dark ? logoClaro : logoOscuro

  /* ── Paleta panel IZQUIERDO (hero) ── */
  const heroBg      = dark ? '#0B0F19' : '#F1F5F9'
  const heroTitle   = dark ? '#FFFFFF' : '#0F172A'
  const heroSub     = dark ? '#CBD5E1' : '#475569'
  const heroCardBg  = dark ? '#1A1F33' : '#FFFFFF'
  const heroCardBd  = dark ? 'transparent' : '#E5E7EB'
  const glow        = dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.07)'

  /* ── Paleta panel DERECHO (form) ── */
  const bg       = dark ? '#0B0F19' : '#F1F5F9'
  const cardBg   = dark ? '#111827' : '#FFFFFF'
  const cardBd   = dark ? '#1F2937' : '#E5E7EB'
  const title    = dark ? '#FFFFFF' : '#0F172A'
  const sub      = dark ? '#CBD5E1' : '#64748B'
  const label    = dark ? '#E5E7EB' : '#374151'
  const inputBg  = dark ? '#1A1F33' : '#F8FAFC'
  const inputBd  = dark ? '#374151' : '#D1D5DB'
  const inputTx  = dark ? '#FFFFFF' : '#0F172A'
  const divider  = dark ? '#374151' : '#E5E7EB'
  const socialBg = dark ? '#1A1F33' : '#FFFFFF'
  const footerTx = dark ? '#6B7280' : '#94A3B8'
  const ctrlBg   = dark ? '#1A1F33' : '#FFFFFF'
  const ctrlBd   = dark ? '#374151' : '#E5E7EB'
  const btnGrad  = dark
    ? 'linear-gradient(to right, #A5B4FC, #8B94FF)'
    : 'linear-gradient(to right, #6366F1, #4F46E5)'

 async function handleLogin() {
  if (!form.email || !form.password) { setError(t.fillFields); return }
  if (!captchaToken) { setError(t.captchaRequired); return }
  setError('')
  setLoading(true)
  try {
    const response = await api.post('/auth/login', {
      email: form.email,
      password: form.password,
      recaptcha_token: captchaToken,
    })
    const { access_token, refresh_token, role, nombre, debe_cambiar_password } = response.data
    const normalizedRole = role?.toString?.().toLowerCase?.()

    if (remember) { localStorage.setItem('pisst_remember', 'true'); localStorage.setItem('pisst_email', form.email) }
    else { localStorage.removeItem('pisst_remember'); localStorage.removeItem('pisst_email') }
    login(access_token, refresh_token, { role: normalizedRole, nombre, email: form.email })

    // Cargar la foto de perfil de una vez para que el avatar se vea desde el primer momento
    try {
      const { data } = await usuariosAPI.getMe()
      updateUser({ foto_url: data?.foto_url || null, id: data?.id || null })
    } catch {
      // si falla, el avatar mostrará las iniciales y se cargará al visitar Perfil
    }

    // ── Guardar el flag en sesión para que el guard de CambiarPassword lo lea ──
    if (debe_cambiar_password) {
      sessionStorage.setItem('pisst_debe_cambiar_password', 'true')
      navigate('/cambiar-password')
      return
    }

    // Si ya no necesita cambiar contraseña, asegurarse de que el flag no exista
    sessionStorage.removeItem('pisst_debe_cambiar_password')

    if (normalizedRole === ROLES.SST || normalizedRole === ROLES.GERENCIA) navigate('/dashboard')
    else if (normalizedRole === ROLES.EMPLEADO) navigate('/empleado/chat')
    else navigate('/chat')

  } catch (err) {
    const status  = err.response?.status
    const detalle = err.response?.data?.detail
    if (status === 429) setError(t.tooMany)
    else setError(typeof detalle === 'string' ? detalle : t.loginError)
    captchaRef.current?.reset()
    setCaptchaToken(null)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <div className="flex flex-1 overflow-hidden">

        {/* ── Columna izquierda (cambia con el tema) ── */}
        <div className="hidden lg:flex w-[55%] flex-col justify-between p-7 relative overflow-hidden"
             style={{ backgroundColor: heroBg }}>
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
               style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />

          <img src={logo} alt="PISST Logo" style={{ height: '140px' }}
               className="object-contain object-left mt-2 z-10" />

          <div className="space-y-6 z-10 -mt-16 flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              <h1 className="font-bold leading-tight" style={{ fontSize: '40px', color: heroTitle }}>
                {t.heroTitle1}{' '}
                <span style={{ color: '#6366F1' }}>{t.heroTitle2}</span>
              </h1>
              <p className="text-sm leading-loose tracking-wide max-w-md" style={{ color: heroSub }}>
                {t.heroDesc}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {[Shield, BarChart2, Users].map((Icon, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                       style={{ backgroundColor: heroCardBg, border: `1px solid ${heroCardBd}` }}>
                    <Icon size={17} style={{ color: '#6366F1' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: heroTitle }}>{t.features[i].titulo}</p>
                    <p className="text-xs mt-1 leading-relaxed tracking-wide" style={{ color: heroSub }}>{t.features[i].desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm z-10 pt-4" style={{ color: '#6366F1' }}>{t.quote}</p>
        </div>

        {/* ── Columna derecha ── */}
        <div className="w-full lg:w-[45%] flex flex-col justify-between p-6 lg:p-8"
             style={{ backgroundColor: bg }}>

          {/* Controles: idioma + tema */}
          <div className="flex justify-end items-center gap-2 pt-4 pb-2">
            {/* Selector de idioma */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-medium transition"
                style={{ backgroundColor: ctrlBg, border: `1px solid ${ctrlBd}`, color: label }}
                aria-label="Seleccionar idioma"
              >
                <Globe size={13} />
                {T[lang].langName}
                <ChevronDown size={11} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 rounded-lg shadow-lg z-50 overflow-hidden min-w-[110px]"
                     style={{ backgroundColor: cardBg, border: `1px solid ${cardBd}` }}>
                  {IDIOMAS.map(({ code, label: lbl }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => { setLang(code); setLangOpen(false) }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm transition hover:opacity-80"
                      style={{ color: code === lang ? '#6366F1' : label }}
                    >
                      {lbl}
                      {code === lang && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Toggle tema */}
            <button
              type="button"
              onClick={() => setDark(d => !d)}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition"
              style={{ backgroundColor: ctrlBg, border: `1px solid ${ctrlBd}` }}
            >
              {dark ? <Sun size={16} style={{ color: '#FBBF24' }} /> : <Moon size={16} style={{ color: '#6366F1' }} />}
            </button>
          </div>

          {/* Card */}
          <div className="max-w-sm w-full mx-auto rounded-2xl p-8 space-y-4"
               style={{ backgroundColor: cardBg, border: `1px solid ${cardBd}`,
                        boxShadow: dark ? '0 25px 50px rgba(43, 48, 78, 0.5)' : '0 20px 40px rgba(15, 23, 42, 0.08)' }}>

            <div>
              <h2 className="font-bold" style={{ fontSize: '26px', color: title }}>{t.welcome}</h2>
              <p className="text-sm mt-1" style={{ color: sub }}>{t.welcomeSub}</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-email" className="text-sm font-medium" style={{ color: label }}>{t.email}</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: inputBg, borderColor: inputBd }}>
                <Mail size={15} style={{ color: sub }} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPh}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: inputTx }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-sm font-medium" style={{ color: label }}>{t.password}</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: inputBg, borderColor: inputBd }}>
                <Lock size={15} style={{ color: sub }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t.passwordPh}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: inputTx }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="flex-shrink-0 transition-opacity hover:opacity-70 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={15} style={{ color: sub }} /> : <Eye size={15} style={{ color: sub }} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[#6366F1]" />
                <span className="text-sm" style={{ color: label }}>{t.remember}</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-sm hover:underline"
                style={{ color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t.forgot}
              </button>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                hl={lang}
                theme={dark ? 'dark' : 'light'}
                onChange={(token) => { setCaptchaToken(token); setCaptchaError(false); setError('') }}
                onExpired={() => setCaptchaToken(null)}
                onErrored={() => setCaptchaError(true)}
              />
            </div>
            {captchaError && (
              <p className="text-xs text-center" style={{ color: '#EF4444' }}>
                No se pudo cargar la verificación de seguridad. Recarga la página o desactiva los bloqueadores de anuncios para continuar.
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !captchaToken}
              className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: btnGrad }}
            >
              {loading ? 'Iniciando sesión…' : `${t.signin} →`}
            </button>
            {error && (
              <p className="text-xs text-center" style={{ color: '#EF4444' }}>{error}</p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: divider }} />
              <span className="text-xs" style={{ color: sub }}>{t.or}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: divider }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled
                      className="border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                      style={{ backgroundColor: socialBg, borderColor: inputBd, color: title }}>
                <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span> Google
              </button>
              <button type="button" disabled
                      className="border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                      style={{ backgroundColor: socialBg, borderColor: inputBd, color: title }}>
                <span>⊞</span> Microsoft
              </button>
            </div>
            <p className="text-center text-xs" style={{ color: sub }}>Próximamente disponible</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 pt-4 pb-2">
            <span className="text-xs" style={{ color: footerTx }}>{t.rights}</span>
            <a href="#" className="text-xs hover:opacity-70" style={{ color: footerTx }}>{t.privacy}</a>
            <a href="#" className="text-xs hover:opacity-70" style={{ color: footerTx }}>{t.terms}</a>
          </div>
        </div>
      </div>
    </div>
  )
}