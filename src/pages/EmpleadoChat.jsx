import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTema } from './EmpleadoLayout'
import {
  Send, Plus, Trash2, Search, Paperclip,
  Shield, BookOpen, GraduationCap, User, ArrowUp, ExternalLink
} from 'lucide-react'
import { chatAPI } from '../services/api'
import logoChatImg from '../assets/imagenes/logo_chat.png'

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
  { icon: Shield,        label: 'Reportar incidente',    ruta: '/empleado/reporte' },
  { icon: BookOpen,      label: 'Consultar normativa'                               },
  { icon: GraduationCap, label: 'Ver mis capacitaciones'                            },
  { icon: User,          label: 'Ver mi perfil',         ruta: '/empleado/perfil'  },
]

const NORMATIVA = [
  { titulo: 'Decreto 1072 de 2015',    desc: '(Libro 2, Parte 2, Título 4, Capítulo 6)' },
  { titulo: 'Resolución 0312 de 2019', desc: '(Estándares Mínimos SG-SST)'              },
]

export default function EmpleadoChat() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { tk }    = useTema()

  const [messages, setMessages] = useState([{
    id: 1, from: 'bot',
    text: 'Estoy aquí para ayudarte con todo lo relacionado con Seguridad y Salud en el Trabajo.',
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }])
  const [historial, setHistorial] = useState([])   // conversaciones del panel derecho
  const [input,     setInput]     = useState('')
  const [typing,    setTyping]    = useState(false)
  const [error,     setError]     = useState(null)
  const bottomRef                 = useRef(null)
  const textareaRef               = useRef(null)

  // Cargar historial al montar
  useEffect(() => {
    chatAPI.getHistorial(1, 5)
      .then(res => setHistorial(res.data))
      .catch(() => {}) // silencioso si no hay historial aún
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const hora = () =>
    new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const send = async (texto = input.trim()) => {
    if (!texto) return
    setError(null)

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
      setError(detalle)
    } finally {
      setTyping(false)
    }
  }

  const autoResize = e => {
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const resetChat = () => {
    setMessages([{
      id: 1, from: 'bot',
      text: 'Estoy aquí para ayudarte con todo lo relacionado con Seguridad y Salud en el Trabajo.',
      hora: hora()
    }])
    setError(null)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

      {/* ── ÁREA CENTRAL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header chat */}
        <div style={{
          padding: '14px 24px', borderBottom: `1px solid ${tk.border}`,
          display: 'flex', alignItems: 'center', gap: 14,
          backgroundColor: tk.sidebar, transition: 'background-color 0.2s'
        }}>
          <SasbotLogo size={46} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: tk.text }}>SASBOT</span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                backgroundColor: 'rgba(99,102,241,0.15)', color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.3)', fontWeight: 500
              }}>Asistente Virtual de PISST</span>
            </div>
            <div style={{ fontSize: 12, color: tk.textFaint, marginTop: 2 }}>
              Estoy aquí para ayudarte con todo lo relacionado con Seguridad y Salud en el Trabajo.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetChat} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${tk.border}`, backgroundColor: tk.card,
              color: tk.textMuted, fontSize: 13, cursor: 'pointer'
            }}>
              <Plus size={14} /> Nueva conversación
            </button>
            <button onClick={resetChat} style={{
              padding: '7px 10px', borderRadius: 8,
              border: `1px solid ${tk.border}`, backgroundColor: tk.card,
              color: tk.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          backgroundColor: tk.bg
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
              gap: 10, alignItems: 'flex-start'
            }}>
              {msg.from === 'bot' && <SasbotAvatar size={34} />}
              <div style={{
                maxWidth: '65%', display: 'flex', flexDirection: 'column',
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
                      🚨 MODO EMERGENCIA — Llama al 123
                    </div>
                  )}
                  {msg.text}
                </div>
                <span style={{
                  fontSize: 11, color: tk.textFaint, marginTop: 4,
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  {msg.hora}
                  {msg.from === 'user' && <span style={{ color: '#6366F1' }}>✓✓</span>}
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

        {/* Sugerencias */}
        <div style={{ padding: '0 24px 10px', backgroundColor: tk.bg }}>
          <div style={{ fontSize: 12, color: tk.textFaint, marginBottom: 8, fontWeight: 500 }}>Sugerencias rápidas</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGERENCIAS.map(({ icon: Icon, label, ruta }) => (
              <button key={label}
                onClick={() => ruta ? navigate(ruta) : send(label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  border: `1px solid ${tk.border}`, backgroundColor: tk.card,
                  color: tk.textMuted, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#818CF8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          margin: '0 24px 10px', padding: '8px 12px', borderRadius: 8,
          backgroundColor: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)',
          fontSize: 12, color: tk.textFaint, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ color: '#6366F1' }}>ℹ</span>
          El asistente responde únicamente sobre temas de Seguridad y Salud en el Trabajo (SG-SST) y normativa colombiana vigente.
        </div>

        {/* Input */}
        <div style={{
          margin: '0 24px 20px',
          backgroundColor: tk.card, border: `1px solid ${tk.border}`,
          borderRadius: 14, overflow: 'hidden'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Escribe tu mensaje..."
            style={{
              width: '100%', padding: '14px 16px', border: 'none',
              backgroundColor: 'transparent', color: tk.text,
              fontSize: 14, resize: 'none', outline: 'none',
              height: 44, maxHeight: 140, fontFamily: 'inherit',
              lineHeight: 1.5, boxSizing: 'border-box'
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderTop: `1px solid ${tk.border}`
          }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, border: `1px solid ${tk.border}`,
              backgroundColor: tk.sidebar, color: tk.textFaint, fontSize: 12, cursor: 'pointer'
            }}>
              <Paperclip size={13} /> Adjuntar archivo
              <span style={{ color: tk.textFaint, fontSize: 11, marginLeft: 4 }}>PDF, JPG, PNG, DOC, DOCX (Máx. 10MB)</span>
            </button>
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
      </div>

      {/* ── PANEL DERECHO ── */}
      <aside style={{
        width: 280, flexShrink: 0,
        borderLeft: `1px solid ${tk.border}`,
        backgroundColor: tk.sidebar, overflowY: 'auto',
        padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20,
        transition: 'background-color 0.2s'
      }}>

        {/* Historial */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: tk.text }}>Historial de conversaciones</span>
            <Search size={15} color={tk.textFaint} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {historial.length > 0 ? historial.map((h, i) => (
              <div key={i} style={{
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                backgroundColor: i === 0 ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: i === 0 ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
                onMouseEnter={e => { if (i !== 0) e.currentTarget.style.backgroundColor = tk.navHover }}
                onMouseLeave={e => { if (i !== 0) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>💬</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: i === 0 ? '#A5B4FC' : tk.textMuted,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4
                    }}>{h.mensaje}</div>
                    <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 2 }}>
                      {new Date(h.timestamp).toLocaleString('es-CO', {
                        hour: '2-digit', minute: '2-digit',
                        day: '2-digit', month: 'short'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: tk.textFaint, textAlign: 'center', padding: '12px 0' }}>
                Aún no hay conversaciones previas.
              </div>
            )}
          </div>
          <button
            onClick={() => chatAPI.getHistorial(1, 20).then(res => setHistorial(res.data)).catch(() => {})}
            style={{
              marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 7,
              border: `1px solid ${tk.border}`, backgroundColor: 'transparent',
              color: '#6366F1', fontSize: 12, cursor: 'pointer'
            }}>
            Ver más conversaciones
          </button>
        </div>

        {/* Ayuda adicional */}
        <div style={{
          padding: 14, borderRadius: 10,
          backgroundColor: tk.card, border: `1px solid ${tk.border}`
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tk.text, marginBottom: 6 }}>¿Necesitas ayuda adicional?</div>
          <div style={{ fontSize: 12, color: tk.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
            Si la respuesta del asistente no resuelve tu inquietud, puedes escalar la conversación al Coordinador SST.
          </div>
          <button style={{
            width: '100%', padding: '9px 0', borderRadius: 8,
            border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
            color: tk.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
          }}>
            <ArrowUp size={14} /> Escalar al Coordinador SST
          </button>
          <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 8, textAlign: 'center' }}>
            Se notificará al Coordinador con el historial de esta conversación.
          </div>
        </div>

        {/* Marco normativo */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: tk.text, marginBottom: 10 }}>Marco normativo de referencia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NORMATIVA.map(n => (
              <div key={n.titulo} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#6366F1', marginTop: 2 }}>•</span>
                <div>
                  <div style={{ fontSize: 12, color: tk.textMuted, fontWeight: 500 }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: tk.textFaint }}>{n.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
            color: '#6366F1', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}>
            Ver más normativa <ExternalLink size={12} />
          </button>
        </div>
      </aside>
    </div>
  )
}