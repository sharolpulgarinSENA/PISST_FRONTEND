import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTema } from './EmpleadoLayout'
import {
  Send, Paperclip,
  Shield, BookOpen, GraduationCap, User, ArrowUp, CheckCheck, AlertTriangle, Sparkles
} from 'lucide-react'
import { chatAPI, getErrorMessage } from '../../../services/api'
import logoChatImg from '../../../assets/imagenes/logo_chat.png'

const ARCHIVO_MAX_BYTES = 10 * 1024 * 1024

/* ── Logo SASBOT ── */
function SasbotLogo({ size = 40 }) {
  return (
    <img
      src={logoChatImg}
      alt="SASBOT"
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
    />
  )
}

function SasbotAvatar({ size = 34 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <SasbotLogo size={size} />
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', backgroundColor: '#6366F1',
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  )
}

const SUGERENCIAS = [
  { icon: Shield,        label: 'Reportar incidente',     ruta: '/empleado/reporte', style: { top: '8%', left: '6%' } },
  { icon: BookOpen,      label: 'Consultar normativa',                              style: { top: '6%', right: '8%' } },
  { icon: GraduationCap, label: 'Ver mis capacitaciones',  ruta: '/empleado/capacitaciones', style: { top: '20%', left: '22%' } },
  { icon: User,          label: 'Ver mi perfil',          ruta: '/empleado/perfil', style: { top: '18%', right: '24%' } },
]

const PLACEHOLDERS = [
  'Escribe tu mensaje...',
  '¿Cómo reporto un incidente?',
  '¿Qué dice el Decreto 1072 de 2015?',
  '¿Cuándo es mi próxima capacitación?',
  'Consulta cualquier duda de SST...',
]

export default function EmpleadoChat() {
  const navigate  = useNavigate()
  const { tk, dark } = useTema()

  const GREETING = {
    id: 'greeting', from: 'bot',
    text: 'Estoy aquí para ayudarte con todo lo relacionado con Seguridad y Salud en el Trabajo.',
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  const [messages, setMessages] = useState([GREETING])
  const [input,     setInput]     = useState('')
  const [typing,    setTyping]    = useState(false)
  const [archivoError, setArchivoError] = useState(null)
  const [escalando, setEscalando] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const bottomRef                 = useRef(null)
  const textareaRef               = useRef(null)
  const fileInputRef              = useRef(null)

  const hasStarted = messages.some(m => m.from === 'user')

  // Cargar la conversación anterior y mostrarla dentro del propio chat
  useEffect(() => {
    chatAPI.getHistorial(1, 10)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : []
        if (data.length === 0) return
        const formatHora = (ts) => ts
          ? new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          : ''
        const previos = [...data].reverse().flatMap((h, i) => {
          const par = []
          if (h.mensaje) par.push({ id: `hist-${i}-u`, from: 'user', text: h.mensaje, hora: formatHora(h.timestamp) })
          if (h.respuesta) par.push({ id: `hist-${i}-b`, from: 'bot', text: h.respuesta, hora: formatHora(h.timestamp) })
          return par
        })
        if (previos.length > 0) {
          setMessages(p => [...previos, { id: 'divider-nueva', type: 'divider', text: 'Conversación nueva' }, ...p])
        }
      })
      .catch(() => {}) // silencioso si no hay historial aún
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Placeholder rotativo del input, al estilo ChatGPT — solo mientras está vacío
  useEffect(() => {
    if (input) return
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [input])

  const hora = () =>
    new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const send = async (texto = input.trim()) => {
    if (!texto) return

    // Agregar mensaje del usuario inmediatamente
    setMessages(p => [...p, { id: Date.now(), from: 'user', text: texto, hora: hora() }])
    setInput('')
    setTyping(true)
    if (textareaRef.current) textareaRef.current.style.height = '44px'

    try {
      // ✅ Ruta correcta: POST /chat/mensaje con { mensaje }
      const res   = await chatAPI.enviarMensaje(texto)
      const reply = res.data?.respuesta || 'No pude obtener una respuesta.'
      const esEmergencia = res.data?.modo_emergencia || false

      setMessages(p => [...p, {
        id: Date.now() + 1,
        from: 'bot',
        text: reply,
        hora: hora(),
        emergencia: esEmergencia
      }])
    } catch (err) {
      const detalle = err.response?.data?.detail || 'No pude conectarme al servidor. Intenta de nuevo.'
      setMessages(p => [...p, {
        id: Date.now() + 1,
        from: 'bot',
        text: detalle,
        hora: hora(),
        esError: true
      }])
    } finally {
      setTyping(false)
    }
  }

  const escalar = async () => {
    setEscalando(true)
    try {
      const { data } = await chatAPI.escalar()
      setMessages(p => [...p, {
        id: Date.now(),
        from: 'bot',
        text: `Tu conversación fue enviada a ${data.coordinador_nombre} (${data.coordinador_email}). Pronto se pondrán en contacto contigo.`,
        hora: hora()
      }])
    } catch (err) {
      setMessages(p => [...p, {
        id: Date.now(),
        from: 'bot',
        text: getErrorMessage(err, 'No se pudo escalar la conversación. Intenta más tarde.'),
        hora: hora(),
        esError: true
      }])
    } finally {
      setEscalando(false)
    }
  }

  const seleccionarArchivo = e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setArchivoError(null)

    const tiposPermitidos = [
      'application/pdf', 'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!tiposPermitidos.includes(file.type)) {
      setArchivoError('Formato no permitido. Usa PDF, JPG, PNG, DOC o DOCX.')
      return
    }
    if (file.size > ARCHIVO_MAX_BYTES) {
      setArchivoError('El archivo supera el límite de 10MB.')
      return
    }
    enviarArchivo(file)
  }

  const enviarArchivo = async (file) => {
    const mensajeAdjunto = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '44px'
    setMessages(p => [...p, {
      id: Date.now(),
      from: 'user',
      text: mensajeAdjunto ? `📎 ${file.name}\n${mensajeAdjunto}` : `📎 ${file.name}`,
      hora: hora()
    }])
    setTyping(true)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      if (mensajeAdjunto) fd.append('mensaje', mensajeAdjunto)
      const { data } = await chatAPI.enviarArchivo(fd)
      setMessages(p => [...p, {
        id: Date.now() + 1,
        from: 'bot',
        text: data?.respuesta || 'No pude obtener una respuesta.',
        hora: hora(),
        emergencia: !!data?.modo_emergencia
      }])
    } catch (err) {
      setMessages(p => [...p, {
        id: Date.now() + 1,
        from: 'bot',
        text: getErrorMessage(err, 'No se pudo analizar el archivo.'),
        hora: hora(),
        esError: true
      }])
    } finally {
      setTyping(false)
    }
  }

  const autoResize = e => {
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const inputPill = (
    <div style={{
      width: '100%', maxWidth: 640, margin: '0 auto',
      backgroundColor: tk.card, border: `1px solid ${tk.border}`,
      borderRadius: 18, overflow: 'hidden',
      boxShadow: dark ? '0 12px 30px rgba(0,0,0,0.35)' : '0 12px 30px rgba(15,23,42,0.08)'
    }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => { setInput(e.target.value); autoResize(e) }}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
        placeholder={PLACEHOLDERS[placeholderIdx]}
        style={{
          width: '100%', padding: '14px 16px', border: 'none',
          backgroundColor: 'transparent', color: tk.text,
          fontSize: 14, resize: 'none', outline: 'none',
          height: 44, maxHeight: 140, fontFamily: 'inherit',
          lineHeight: 1.5, boxSizing: 'border-box'
        }}
      />
      {archivoError && (
        <div style={{ padding: '0 12px 8px', fontSize: 12, color: '#EF4444' }}>{archivoError}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderTop: `1px solid ${tk.border}`
      }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={typing}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7, border: `1px solid ${tk.border}`,
            backgroundColor: tk.sidebar, color: tk.textFaint, fontSize: 12,
            cursor: typing ? 'not-allowed' : 'pointer', opacity: typing ? 0.6 : 1
          }}>
          <Paperclip size={13} /> <span className="empleado-chat-header-extra">Adjuntar archivo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
          onChange={seleccionarArchivo}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || typing}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
            background: input.trim() && !typing ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : tk.border,
            color: input.trim() && !typing ? '#fff' : tk.textFaint,
            cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
      position: 'relative', overflow: 'hidden'
    }}>

      {/* Top bar minimalista */}
      <div style={{
        flexShrink: 0, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SasbotLogo size={28} />
          <span style={{ fontWeight: 700, fontSize: 14, color: tk.text }}>SASBOT</span>
        </div>
        <button
          onClick={escalar}
          disabled={escalando}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            border: 'none', background: escalando ? tk.border : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            color: escalando ? tk.textFaint : '#fff', fontSize: 13, fontWeight: 600,
            cursor: escalando ? 'not-allowed' : 'pointer', opacity: escalando ? 0.6 : 1
          }}>
          <ArrowUp size={14} />
          {escalando ? 'Escalando...' : 'Escalar'}
        </button>
      </div>

      {/* Chips flotantes de sugerencias — solo antes del primer mensaje */}
      {!hasStarted && SUGERENCIAS.map(({ icon: Icon, label, ruta, style }, i) => (
        <motion.button
          key={label}
          onClick={() => ruta ? navigate(ruta) : send(label)}
          className="empleado-chat-floating-chip"
          style={{
            position: 'absolute', ...style, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            border: `1px solid ${tk.border}`, backgroundColor: tk.card,
            color: tk.textMuted, fontSize: 12, cursor: 'pointer',
            boxShadow: dark ? '0 8px 20px rgba(0,0,0,0.25)' : '0 8px 20px rgba(15,23,42,0.06)'
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.6 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#818CF8' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted }}
        >
          <Icon size={13} /> {label}
        </motion.button>
      ))}

      {!hasStarted ? (
        /* ── Pantalla vacía, centrada ── */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 24px'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 50px rgba(99,102,241,0.35)'
          }}>
            <SasbotLogo size={64} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: tk.text, margin: 0
            }}>
              <Sparkles size={18} style={{ color: '#818CF8' }} /> ¿En qué puedo ayudarte hoy?
            </h2>
            <p style={{ fontSize: 13, color: tk.textFaint, marginTop: 8, maxWidth: 420 }}>
              {GREETING.text}
            </p>
          </div>
          <div style={{ width: '100%', maxWidth: 640 }}>
            {inputPill}
          </div>
        </div>
      ) : (
        <>
          {/* Mensajes */}
          <div style={{
            flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 24px',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map(msg => msg.type === 'divider' ? (
                <div key={msg.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  margin: '4px 0', color: tk.textFaint, fontSize: 11
                }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: tk.border }} />
                  {msg.text}
                  <div style={{ flex: 1, height: 1, backgroundColor: tk.border }} />
                </div>
              ) : (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
                  gap: 10, alignItems: 'flex-start'
                }}>
                  {msg.from === 'bot' && <SasbotAvatar size={34} />}
                  <div style={{
                    maxWidth: '80%', display: 'flex', flexDirection: 'column',
                    alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.from === 'bot' && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#818CF8', marginBottom: 4 }}>SASBOT</span>
                    )}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.from === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      backgroundColor: msg.emergencia
                        ? 'rgba(239,68,68,0.1)'
                        : msg.esError
                          ? 'rgba(245,158,11,0.1)'
                          : msg.from === 'user'
                            ? '#4F46E5'
                            : tk.card,
                      border: msg.from === 'bot'
                        ? `1px solid ${msg.emergencia ? 'rgba(239,68,68,0.4)' : msg.esError ? 'rgba(245,158,11,0.4)' : tk.border}`
                        : 'none',
                      fontSize: 14, lineHeight: 1.6,
                      color: msg.from === 'user' ? '#fff' : tk.text,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {/* Badge de emergencia */}
                      {msg.emergencia && (
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: '#EF4444',
                          marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <AlertTriangle size={12} /> MODO EMERGENCIA — Llama al 123
                        </div>
                      )}
                      {msg.text}
                    </div>
                    <span style={{
                      fontSize: 11, color: tk.textFaint, marginTop: 4,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      {msg.hora}
                      {msg.from === 'user' && <CheckCheck size={13} style={{ color: '#6366F1' }} />}
                    </span>
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <SasbotAvatar size={34} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#818CF8', display: 'block', marginBottom: 4 }}>SASBOT</span>
                    <div style={{
                      padding: '10px 14px', borderRadius: '4px 14px 14px 14px',
                      backgroundColor: tk.card, border: `1px solid ${tk.border}`,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span style={{ fontSize: 13, color: tk.textFaint }}>Escribiendo</span>
                      <TypingDots />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input anclado abajo, angosto y centrado */}
          <div style={{ flexShrink: 0, padding: '0 24px 20px' }}>
            {inputPill}
          </div>
        </>
      )}
    </div>
  )
}
