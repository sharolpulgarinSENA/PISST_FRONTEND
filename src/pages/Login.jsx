import { Mail, Lock, Eye, EyeOff, Shield, BarChart2, Users, Globe } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/imagenes/pisst_logo.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
    const [showPass, setShowPass] = useState(false)
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B0F19' }}>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Columna izquierda ── */}
        <div className="hidden lg:flex w-[55%] flex-col justify-between p-7 relative overflow-hidden"
            style={{ backgroundColor: '#0B0F19' }}>

        {/* Luz de fondo */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

        {/* Logo */}
        <img src={logo} alt="PISST Logo"
            style={{ height: '140px' }} // Reducido un toque para dar más aire limpio
            className="object-contain object-left mt-2 z-10" />

        {/* Contenedor Agrupado que sube el contenido (Ajustado con -mt-16 para alineación perfecta con el Login) */}
        <div className="space-y-6 z-10 -mt-16 flex-1 flex flex-col justify-center">
            
            {/* Texto principal */}
            <div className="space-y-4">
            <h1 className="text-white font-bold leading-tight" style={{ fontSize: '40px' }}>
                Plataforma integral SST{' '}
                <span style={{ color: '#6366F1' }}>Potenciadora de procesos</span>
            </h1>
            {/* Se aumentó el interlineado a leading-loose y el texto a text-sm/tracking-wide */}
            <p className="text-sm leading-loose tracking-wide max-w-md" style={{ color: '#9CA3AF' }}>
                PISST centraliza la gestión de procesos SG-SST en un solo lugar,
                con herramientas seguras, intuitivas y diseñadas para equipos de
                alto rendimiento.
            </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-2">
            {[
                { icon: Shield,   titulo: 'Seguridad y privacidad',   desc: 'Protección de datos médicos con cifrado de extremo a extremo y cumplimiento normativo.' },
                { icon: BarChart2, titulo: 'Gestión inteligente',      desc: 'Automatiza procesos y optimiza recursos con análisis predictivo en tiempo real.' },
                { icon: Users,     titulo: 'Colaboración sin límites', desc: 'Coordina equipos multidisciplinarios con comunicación fluida y acceso compartido.' },
            ].map(({ icon: Icon, titulo, desc }) => (
                <div key={titulo} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: '#1A1F33' }}>
                    <Icon size={17} style={{ color: '#6366F1' }} />
                </div>
                <div>
                    <p className="text-white font-semibold text-sm">{titulo}</p>
                    {/* Se mejoró el interlineado de las descripciones cortas */}
                    <p className="text-xs mt-1 leading-relaxed tracking-wide" style={{ color: '#9CA3AF' }}>{desc}</p>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Frase Fija Abajo */}
        <p className="text-sm z-10 pt-4" style={{ color: '#6366F1' }}>
            ❝ Tecnología que cuida, gestión que transforma.
        </p>
        </div>
        {/* ── Columna derecha ── */}
        <div className="w-full lg:w-[45%] flex flex-col justify-between p-6 lg:p-8"
             style={{ backgroundColor: '#0B0F19' }}>

          {/* Idioma */}
          <div className="flex justify-end pt-4 pb-2">
            <span className="text-sm flex items-center gap-1.5 cursor-pointer" style={{ color: '#9CA3AF' }}>
              <Globe size={14} /> Español ▾
            </span>
          </div>

          {/* Card flotante */}
          <div className="max-w-sm w-full mx-auto rounded-2xl p-8 space-y-4"
               style={{
                 backgroundColor: '#111827',
                 border: '1px solid #1F2937',
                 boxShadow: '0 25px 50px rgba(43, 48, 78, 0.5)'
               }}>

            <div>
              <h2 className="text-white font-bold" style={{ fontSize: '26px' }}>Bienvenido de nuevo</h2>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Inicia sesión para continuar en tu cuenta</p>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#E5E7EB' }}>Correo electrónico</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
                <Mail size={15} style={{ color: '#9CA3AF' }} />
                <input
                type="email"
                placeholder="tu@pisst.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-transparent text-white text-sm outline-none w-full placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: '#E5E7EB' }}>Contraseña</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5"
                   style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
                <Lock size={15} style={{ color: '#9CA3AF' }} />
                <input
                type={showPass ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-transparent text-white text-sm outline-none w-full placeholder:text-[#9CA3AF]"
                />

              </div>
            </div>

            {/* Recordarme */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#6366F1]" />
                <span className="text-sm" style={{ color: '#E5E7EB' }}>Recordarme</span>
              </label>
              <a href="#" className="text-sm hover:underline" style={{ color: '#6366F1' }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón */}
            <button
               onClick={async () => {
                if (!form.email || !form.password) {
                  setError('Por favor completa todos los campos')
                  return
                }
                setError('')
               try {
                  const response = await api.post('/auth/login', {
                    email: form.email,
                    password: form.password,
                    recaptcha_token: 'test',
                  })
                  const { access_token, role, nombre } = response.data
                  const normalizedRole = role?.toString?.().toLowerCase?.()
                  login(access_token, { role: normalizedRole, nombre, email: form.email })
                  if (normalizedRole === 'sst') navigate('/dashboard')
                  else if (normalizedRole === 'gerencia') navigate('/dashboard')
                  else navigate('/chat')
                } catch (err) {
                  const status  = err.response?.status
                  const detalle = err.response?.data?.detail || 'Error al iniciar sesión'
                  if (status === 429) {
                    setError('Demasiados intentos. Intenta más tarde.')
                  } else {
                    setError(typeof detalle === 'string' ? detalle : 'Correo o contraseña incorrectos')
                  }
                }
              }}
                className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ background: 'linear-gradient(to right, #A5B4FC, #8B94FF)' }}
                >
                Iniciar sesión →
                </button>
                {/* en caso de error */}
                {error && (
                <p className="text-xs text-center" style={{ color: '#EF4444' }}>
                    {error}
                </p>
                )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>o continúa con</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
            </div>

            {/* Google y Microsoft */}
            <div className="grid grid-cols-2 gap-3">
              <button className="border rounded-lg py-2 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
                      style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
                <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span> Google
              </button>
              <button className="border rounded-lg py-2 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition"
                      style={{ backgroundColor: '#1A1F33', borderColor: '#374151' }}>
                <span>⊞</span> Microsoft
              </button>
            </div>

            <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
              ¿No tienes una cuenta?{' '}
              <a href="#" className="hover:underline" style={{ color: '#6366F1' }}>Solicita acceso</a>
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 pt-4 pb-2">
            <span className="text-xs" style={{ color: '#6B7280' }}>© 2026 PISST. Todos los derechos reservados.</span>
            <a href="#" className="text-xs hover:text-white" style={{ color: '#6B7280' }}>Privacidad</a>
            <a href="#" className="text-xs hover:text-white" style={{ color: '#6B7280' }}>Términos</a>
          </div>

        </div>
      </div>
    </div>
  )
}