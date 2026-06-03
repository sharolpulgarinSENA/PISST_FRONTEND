// import { Mail, Lock, Eye, EyeOff, Shield, BarChart2, Users, Globe } from 'lucide-react'
// import { useState } from 'react'
// import logo from '../assets/imagenes/pisst_logo.png'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import api from '../services/api'

// export default function Login() {
//     const [showPass, setShowPass] = useState(false)
//     const [form, setForm] = useState({ email: '', password: '' })
//     const [error, setError] = useState('')
//     const navigate = useNavigate()
//     const { login } = useAuth()

//   return (
//     <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B0F19' }}>

//       <div className="flex flex-1 overflow-hidden">

//         {/* ── Columna izquierda ── */}
//         <div className="hidden lg:flex w-[55%] flex-col justify-between p-7 relative overflow-hidden"
//             style={{ backgroundColor: '#0B0F19' }}>

//         {/* Luz de fondo */}
//         <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
//             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

//         {/* Logo */}
//         <img src={logo} alt="PISST Logo"
//             style={{ height: '140px' }}
//             className="object-contain object-left mt-2 z-10" />

//         <div className="space-y-6 z-10 -mt-16 flex-1 flex flex-col justify-center">
//             <div className="space-y-4">
//             <h1 className="text-white font-bold leading-tight" style={{ fontSize: '40px' }}>
//                 Plataforma integral SST{' '}
//                 <span style={{ color: '#6366F1' }}>Potenciadora de procesos</span>
//             </h1>
//             <p className="text-sm leading-loose tracking-wide max-w-md" style={{ color: '#9CA3AF' }}>
//                 PISST centraliza la gestión de procesos SG-SST en un solo lugar,
//                 con herramientas seguras, intuitivas y diseñadas para equipos de
//                 alto rendimiento.
//             </p>
//             </div>

//             <div className="space-y-4 pt-2">
//             {[
//                 { icon: Shield,    titulo: 'Seguridad y privacidad',   desc: 'Protección de datos médicos con cifrado de extremo a extremo y cumplimiento normativo.' },
//                 { icon: BarChart2, titulo: 'Gestión inteligente',      desc: 'Automatiza procesos y optimiza recursos con análisis predictivo en tiempo real.' },
//                 { icon: Users,     titulo: 'Colaboración sin límites', desc: 'Coordina equipos multidisciplinarios con comunicación fluida y acceso compartido.' },
//             ].map(({ icon: Icon, titulo, desc }) => (
//                 <div key={titulo} className="flex items-start gap-4">
//                 <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
//                     style={{ backgroundColor: '#1A1F33' }}>
//                     <Icon size={17} style={{ color: '#6366F1' }} />
//                 </div>
//                 <div>
//                     <p className="text-white font-semibold text-sm">{titulo}</p>
//                     <p className="text-xs mt-1 leading-relaxed tracking-wide" style={{ color: '#9CA3AF' }}>{desc}</p>
//                 </div>
//                 </div>
//             ))}
//             </div>
//         </div>

//         <p className="text-sm z-10 pt-4" style={{ color: '#6366F1' }}>
//             ❝ Tecnología que cuida, gestión que transforma.
//         </p>
//         </div>

//         {/* ── Columna derecha ── */}
//         <div className="w-full lg:w-[45%] flex flex-col justify-between p-6 lg:p-8"
//              style={{ backgroundColor: '#0B0F19' }}>

//           {/* Idioma */}
//           <div className="flex justify-end pt-4 pb-2">
//             <span className="text-sm flex items-center gap-1.5 cursor-pointer" style={{ color: '#9CA3AF' }}>
//               <Globe size={14} /> Español ▾
//             </span>
//           </div>

//           {/* Card flotante */}
//           <div className="max-w-sm w-full mx-auto rounded-2xl p-8 space-y-4"
//                style={{
//                  backgroundColor: '#111827',
//                  border: '1px solid #1F2937',
//                  boxShadow: '0 25px 50px rgba(43, 48, 78, 0.5)'
//                }}>

//             <div>
//               <h2 className="text-white font-bold" style={{ fontSize: '26px' }}>Bienvenido de nuevo</h2>
//               <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Inicia sesión para continuar en tu cuenta</p>
//             </div>

//             {/* Email */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium" style={{ color: '#E5E7EB' }}>Correo electrónico</label>
//               <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
//                    style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
//                 <Mail size={15} style={{ color: '#9CA3AF' }} />
//                 <input
//                   type="email"
//                   placeholder="tu@pisst.com"
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   className="bg-transparent text-white text-sm outline-none w-full placeholder:text-[#9CA3AF]"
//                 />
//               </div>
//             </div>

//             {/* Contraseña — con toggle mostrar/ocultar */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium" style={{ color: '#E5E7EB' }}>Contraseña</label>
//               <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
//                    style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
//                 <Lock size={15} style={{ color: '#9CA3AF' }} />
//                 <input
//                   type={showPass ? 'text' : 'password'}
//                   placeholder="Tu contraseña"
//                   value={form.password}
//                   onChange={(e) => setForm({ ...form, password: e.target.value })}
//                   className="bg-transparent text-white text-sm outline-none w-full placeholder:text-[#9CA3AF]"
//                 />
//                 {/* Toggle ojo */}
//                 <button
//                   type="button"
//                   onClick={() => setShowPass(v => !v)}
//                   className="flex-shrink-0 transition-opacity hover:opacity-70 focus:outline-none"
//                   tabIndex={-1}
//                   aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
//                 >
//                   {showPass
//                     ? <EyeOff size={15} style={{ color: '#9CA3AF' }} />
//                     : <Eye    size={15} style={{ color: '#9CA3AF' }} />
//                   }
//                 </button>
//               </div>
//             </div>

//             {/* Recordarme */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="checkbox" defaultChecked className="accent-[#6366F1]" />
//                 <span className="text-sm" style={{ color: '#E5E7EB' }}>Recordarme</span>
//               </label>
//               <a href="#" className="text-sm hover:underline" style={{ color: '#6366F1' }}>
//                 ¿Olvidaste tu contraseña?
//               </a>
//             </div>

//             {/* Botón */}
//             <button
//                onClick={async () => {
//                 if (!form.email || !form.password) {
//                   setError('Por favor completa todos los campos')
//                   return
//                 }
//                 setError('')
//                 try {
//                   const response = await api.post('/auth/login', {
//                     email: form.email,
//                     password: form.password,
//                     recaptcha_token: 'test',
//                   })
//                   const { access_token, refresh_token, role, nombre } = response.data
//                   const normalizedRole = role?.toString?.().toLowerCase?.()
//                   login(access_token, refresh_token, { role: normalizedRole, nombre, email: form.email })
//                   if (normalizedRole === 'sst') navigate('/dashboard')
//                   else if (normalizedRole === 'gerencia') navigate('/dashboard')
//                   else navigate('/chat')
//                 } catch (err) {
//                   const status  = err.response?.status
//                   const detalle = err.response?.data?.detail || 'Error al iniciar sesión'
//                   if (status === 429) {
//                     setError('Demasiados intentos. Intenta más tarde.')
//                   } else {
//                     setError(typeof detalle === 'string' ? detalle : 'Correo o contraseña incorrectos')
//                   }
//                 }
//               }}
//                 className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition"
//                 style={{ background: 'linear-gradient(to right, #A5B4FC, #8B94FF)' }}
//                 >
//                 Iniciar sesión →
//                 </button>
//                 {error && (
//                 <p className="text-xs text-center" style={{ color: '#EF4444' }}>
//                     {error}
//                 </p>
//                 )}

//             {/* Divider */}
//             <div className="flex items-center gap-3">
//               <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
//               <span className="text-xs" style={{ color: '#9CA3AF' }}>o continúa con</span>
//               <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
//             </div>

//             {/* Google y Microsoft */}
//             <div className="grid grid-cols-2 gap-3">
//               <button className="border rounded-lg py-2 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
//                       style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
//                 <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span> Google
//               </button>
//               <button className="border rounded-lg py-2 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
//                       style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
//                 <span>⊞</span> Microsoft
//               </button>
//             </div>

//             <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
//               ¿No tienes una cuenta?{' '}
//               <a href="#" className="hover:underline" style={{ color: '#6366F1' }}>Solicita acceso</a>
//             </p>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-center gap-6 pt-4 pb-2">
//             <span className="text-xs" style={{ color: '#6B7280' }}>© 2026 PISST. Todos los derechos reservados.</span>
//             <a href="#" className="text-xs hover:text-white" style={{ color: '#6B7280' }}>Privacidad</a>
//             <a href="#" className="text-xs hover:text-white" style={{ color: '#6B7280' }}>Términos</a>
//           </div>

//         </div>
//       </div>
//     </div>
//   )
// }

import { Mail, Lock, Eye, EyeOff, Shield, BarChart2, Users, Globe, Sun, Moon, ChevronDown, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import logoClaro from '../assets/imagenes/pisst_logo.png'                       // logo claro → fondo oscuro
import logoOscuro from '../assets/imagenes/logopisstCLaro-removebg-preview.png' // logo oscuro → fondo claro
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

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
    quote: '❝ Tecnología que cuida, gestión que transforma.',
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
    quote: '❝ Technology that cares, management that transforms.',
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
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

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
  const heroSub     = dark ? '#9CA3AF' : '#475569'
  const heroCardBg  = dark ? '#1A1F33' : '#FFFFFF'
  const heroCardBd  = dark ? 'transparent' : '#E5E7EB'
  const glow        = dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.07)'

  /* ── Paleta panel DERECHO (form) ── */
  const bg       = dark ? '#0B0F19' : '#F1F5F9'
  const cardBg   = dark ? '#111827' : '#FFFFFF'
  const cardBd   = dark ? '#1F2937' : '#E5E7EB'
  const title    = dark ? '#FFFFFF' : '#0F172A'
  const sub      = dark ? '#9CA3AF' : '#64748B'
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
  setError('')
  setLoading(true)
  try {
    const response = await api.post('/auth/login', {
      email: form.email,
      password: form.password,
      recaptcha_token: 'test',
    })
    const { access_token, refresh_token, role, nombre, debe_cambiar_password } = response.data
    const normalizedRole = role?.toString?.().toLowerCase?.()

    login(access_token, refresh_token, { role: normalizedRole, nombre, email: form.email })

    // ── Guardar el flag en sesión para que el guard de CambiarPassword lo lea ──
    if (debe_cambiar_password) {
      sessionStorage.setItem('pisst_debe_cambiar_password', 'true')
      navigate('/cambiar-password')
      return
    }

    // Si ya no necesita cambiar contraseña, asegurarse de que el flag no exista
    sessionStorage.removeItem('pisst_debe_cambiar_password')

    if (normalizedRole === 'sst' || normalizedRole === 'gerencia') navigate('/dashboard')
    else navigate('/chat')

  } catch (err) {
    const status  = err.response?.status
    const detalle = err.response?.data?.detail
    if (status === 429) setError(t.tooMany)
    else setError(typeof detalle === 'string' ? detalle : t.loginError)
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

          {/* Controles: tema + idioma */}
          <div className="flex justify-end items-center gap-2 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setDark(d => !d)}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition"
              style={{ backgroundColor: ctrlBg, border: `1px solid ${ctrlBd}` }}
            >
              {dark ? <Sun size={16} style={{ color: '#FBBF24' }} /> : <Moon size={16} style={{ color: '#6366F1' }} />}
            </button>

            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(o => !o)}
                className="text-sm flex items-center gap-1.5 px-2.5 h-9 rounded-lg transition"
                style={{ color: sub, backgroundColor: ctrlBg, border: `1px solid ${ctrlBd}` }}
              >
                <Globe size={14} /> {t.langName}
                <ChevronDown size={13} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-50 min-w-[130px]"
                     style={{ backgroundColor: cardBg, border: `1px solid ${cardBd}` }}>
                  {IDIOMAS.map(idi => (
                    <button
                      key={idi.code}
                      type="button"
                      onClick={() => { setLang(idi.code); setLangOpen(false) }}
                      className="w-full px-3 py-2 text-sm text-left flex items-center justify-between transition hover:bg-indigo-500/10"
                      style={{ color: lang === idi.code ? '#6366F1' : title }}
                    >
                      {idi.label}
                      {lang === idi.code && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <label className="text-sm font-medium" style={{ color: label }}>{t.email}</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: inputBg, borderColor: inputBd }}>
                <Mail size={15} style={{ color: sub }} />
                <input
                  type="email"
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
              <label className="text-sm font-medium" style={{ color: label }}>{t.password}</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: inputBg, borderColor: inputBd }}>
                <Lock size={15} style={{ color: sub }} />
                <input
                  type={showPass ? 'text' : 'password'}
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
                <input type="checkbox" defaultChecked className="accent-[#6366F1]" />
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

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              style={{ background: btnGrad }}
            >
              {loading ? '...' : `${t.signin} →`}
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
              <button className="border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
                      style={{ backgroundColor: socialBg, borderColor: inputBd, color: title }}>
                <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span> Google
              </button>
              <button className="border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
                      style={{ backgroundColor: socialBg, borderColor: inputBd, color: title }}>
                <span>⊞</span> Microsoft
              </button>
            </div>

            <p className="text-sm text-center" style={{ color: sub }}>
              {t.noAccount}{' '}
              <a href="#" className="hover:underline" style={{ color: '#6366F1' }}>{t.requestAccess}</a>
            </p>
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