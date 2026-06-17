import { useState, useEffect, useRef } from 'react'
import {
  X, Send, Paperclip, Loader2, AlertTriangle, ClipboardList, ChevronUp, RefreshCw,
} from 'lucide-react'
import casco from '../../assets/imagenes/concasco-removebg-preview.png'
import { chatAPI, getErrorMessage } from '../../services/api'
import { normFecha } from '../../utils/dates'

const HISTORIAL_LIMITE = 20
const ARCHIVO_MAX_BYTES = 10 * 1024 * 1024

const TIPOS_REPORTE = [
  { value: 'accidente',          label: 'Accidente' },
  { value: 'condicion_insegura', label: 'Condición insegura' },
  { value: 'cuasi_accidente',    label: 'Cuasi accidente' },
]

function fmtHora(f) {
  if (!f) return ''
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit',
  }).format(new Date(normFecha(f)))
}

function MensajeBurbuja({ rol, texto, hora, emergencia, error, cargando, theme }) {
  const { darkMode, border, text } = theme
  const esUsuario = rol === 'user'
  const bg = error
    ? 'rgba(239,68,68,0.1)'
    : esUsuario
      ? '#6366F1'
      : (darkMode ? '#1F2937' : '#F3F4F6')
  const color = error ? '#EF4444' : esUsuario ? '#FFFFFF' : text

  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
        style={{
          backgroundColor: bg,
          color,
          border: emergencia ? '1px solid #EF4444' : `1px solid ${esUsuario ? 'transparent' : border}`,
        }}
      >
        {cargando
          ? <Loader2 size={14} className="animate-spin" style={{ color: darkMode ? '#CBD5E1' : '#6B7280' }} />
          : texto}
        {hora && !cargando && (
          <p className="text-[10px] mt-1 opacity-60">{fmtHora(hora)}</p>
        )}
      </div>
    </div>
  )
}

function ReporteRapidoForm({ form, setForm, onSubmit, onCancel, enviando, theme }) {
  const { border, input, text, sub } = theme
  const fieldStyle = { backgroundColor: input, color: text, border: `1px solid ${border}` }

  return (
    <div className="border-t p-3 space-y-2 shrink-0" style={{ borderColor: border }}>
      <p className="text-xs font-semibold" style={{ color: text }}>Reporte rápido</p>
      <select
        value={form.tipo}
        onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
        className="w-full text-sm rounded-lg px-2 py-1.5 outline-none"
        style={fieldStyle}
      >
        {TIPOS_REPORTE.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <textarea
        value={form.descripcion}
        onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
        placeholder="Describe lo ocurrido..."
        rows={2}
        className="w-full text-sm rounded-lg px-2 py-1.5 outline-none resize-none"
        style={fieldStyle}
      />
      <input
        value={form.lugar}
        onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value }))}
        placeholder="Lugar (opcional)"
        className="w-full text-sm rounded-lg px-2 py-1.5 outline-none"
        style={fieldStyle}
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={enviando}
          className="flex-1 text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50"
          style={{ color: sub, border: `1px solid ${border}` }}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={enviando || !form.descripcion.trim()}
          className="flex-1 text-xs py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#6366F1' }}
        >
          {enviando ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </div>
  )
}

export default function SasbotWidget({ darkMode }) {
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'
  const theme  = { darkMode, card, border, text, sub, input }

  const [open, setOpen] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [pagina, setPagina] = useState(1)
  const [hayMasHistorial, setHayMasHistorial] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [inputTexto, setInputTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modoEmergencia, setModoEmergencia] = useState(false)
  const [escalando, setEscalando] = useState(false)
  const [mostrarReporte, setMostrarReporte] = useState(false)
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [reporteForm, setReporteForm] = useState({ tipo: 'accidente', descripcion: '', lugar: '' })
  const [archivoError, setArchivoError] = useState(null)
  const [vpState, setVpState] = useState({ kbH: 0, vvH: typeof window !== 'undefined' ? window.innerHeight : 800 })

  const widgetRef = useRef(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const cargandoMasRef = useRef(false)
  const prevScrollHeightRef = useRef(0)

  useEffect(() => {
    if (open && !cargado) {
      cargarHistorial(1)
      setCargado(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: load history only once per session (cargado flag); cargarHistorial reference changes on each render
  }, [open])

  useEffect(() => {
    if (!open) return
    if (cargandoMasRef.current) {
      cargandoMasRef.current = false
      const diff = (scrollRef.current?.scrollHeight ?? 0) - prevScrollHeightRef.current
      if (diff > 0) scrollRef.current?.scrollTo({ top: diff })
      return
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [mensajes, open, enviando])

  useEffect(() => {
    function handleClickOutside(e) {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Adapta posición y altura cuando el teclado virtual abre/cierra (iOS Safari + Android)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setVpState({ kbH: kbH > 50 ? kbH : 0, vvH: vv.height })
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [])

  async function cargarHistorial(pag) {
    if (pag === 1) setCargandoHistorial(true)
    else { setCargandoMas(true); cargandoMasRef.current = true; prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0 }

    try {
      const { data } = await chatAPI.getHistorial(pag, HISTORIAL_LIMITE)
      const registros = Array.isArray(data) ? data : []
      const nuevos = registros.slice().reverse().flatMap((h) => ([
        { rol: 'user', texto: h.mensaje, hora: h.timestamp },
        { rol: 'bot',  texto: h.respuesta, hora: h.timestamp },
      ]))
      setMensajes((prev) => (pag === 1 ? nuevos : [...nuevos, ...prev]))
      setHayMasHistorial(registros.length === HISTORIAL_LIMITE)
      setPagina(pag)
    } catch {
      // silencioso: el historial no es crítico para poder chatear
    } finally {
      setCargandoHistorial(false)
      setCargandoMas(false)
    }
  }

  async function enviarMensaje() {
    const texto = inputTexto.trim()
    if (!texto || enviando) return
    setInputTexto('')
    setArchivoError(null)
    setMensajes((prev) => [...prev, { rol: 'user', texto, hora: new Date().toISOString() }])
    setEnviando(true)
    try {
      const { data } = await chatAPI.enviarMensaje(texto)
      setMensajes((prev) => [...prev, {
        rol: 'bot', texto: data?.respuesta || '...', hora: new Date().toISOString(),
        emergencia: !!data?.modo_emergencia,
      }])
      setModoEmergencia(!!data?.modo_emergencia)
    } catch {
      setMensajes((prev) => [...prev, {
        rol: 'bot', texto: 'No se pudo conectar con SASBOT. Intenta de nuevo en un momento.',
        hora: new Date().toISOString(), error: true,
      }])
    } finally {
      setEnviando(false)
    }
  }

  function manejarTeclaInput(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  async function escalar() {
    setEscalando(true)
    try {
      const { data } = await chatAPI.escalar()
      setModoEmergencia(false)
      setMensajes((prev) => [...prev, {
        rol: 'bot',
        texto: `Tu conversación fue enviada a ${data.coordinador_nombre} (${data.coordinador_email}). Pronto se pondrán en contacto contigo.`,
        hora: new Date().toISOString(),
      }])
    } catch (err) {
      setMensajes((prev) => [...prev, {
        rol: 'bot',
        texto: getErrorMessage(err, null) || 'No se pudo escalar la conversación. Intenta más tarde.',
        hora: new Date().toISOString(), error: true,
      }])
    } finally {
      setEscalando(false)
    }
  }

  function seleccionarArchivo(e) {
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

  async function enviarArchivo(file) {
    const mensajeAdjunto = inputTexto.trim()
    setInputTexto('')
    setMensajes((prev) => [...prev, {
      rol: 'user',
      texto: mensajeAdjunto ? `📎 ${file.name}\n${mensajeAdjunto}` : `📎 ${file.name}`,
      hora: new Date().toISOString(),
    }])
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      if (mensajeAdjunto) formData.append('mensaje', mensajeAdjunto)
      const { data } = await chatAPI.enviarArchivo(formData)
      setMensajes((prev) => [...prev, {
        rol: 'bot', texto: data?.respuesta || '...', hora: new Date().toISOString(),
        emergencia: !!data?.modo_emergencia,
      }])
      setModoEmergencia(!!data?.modo_emergencia)
    } catch (err) {
      setMensajes((prev) => [...prev, {
        rol: 'bot', texto: getErrorMessage(err, null) || 'No se pudo analizar el archivo.',
        hora: new Date().toISOString(), error: true,
      }])
    } finally {
      setEnviando(false)
    }
  }

  async function enviarReporte() {
    if (!reporteForm.descripcion.trim()) return
    setEnviandoReporte(true)
    try {
      const { data } = await chatAPI.reporteRapido({
        tipo: reporteForm.tipo,
        descripcion: reporteForm.descripcion.trim(),
        lugar: reporteForm.lugar.trim() || 'No especificado',
      })
      const tipoLabel = TIPOS_REPORTE.find((t) => t.value === reporteForm.tipo)?.label || reporteForm.tipo
      setMensajes((prev) => [...prev,
        { rol: 'user', texto: `Reporte rápido — ${tipoLabel}: ${reporteForm.descripcion.trim()}`, hora: new Date().toISOString() },
        {
          rol: 'bot',
          texto: `${data.mensaje}. ID #${String(data.incidente_id).slice(0, 8)}. El equipo SST ya fue notificado.`,
          hora: new Date().toISOString(),
        },
      ])
      setReporteForm({ tipo: 'accidente', descripcion: '', lugar: '' })
      setMostrarReporte(false)
    } catch (err) {
      setMensajes((prev) => [...prev, {
        rol: 'bot', texto: getErrorMessage(err, null) || 'No se pudo registrar el reporte.',
        hora: new Date().toISOString(), error: true,
      }])
    } finally {
      setEnviandoReporte(false)
    }
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed right-4 lg:right-6 z-50 flex flex-col items-end gap-3${vpState.kbH === 0 ? ' bottom-20 lg:bottom-6' : ''}`}
      style={vpState.kbH > 0 ? { bottom: vpState.kbH + 8 } : undefined}
    >
      {open && (
        <div
          className="w-[92vw] max-w-sm flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: card,
            border: `1px solid ${border}`,
            height: '32rem',
            maxHeight: vpState.kbH > 0
              ? `${Math.max(220, vpState.vvH - 76)}px`
              : 'min(32rem, 75dvh)',
          }}
          role="dialog" aria-modal="true" aria-label="Asistente SASBOT"
        >
          {/* Cabecera */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: '#6366F1' }}>
            <img src={casco} alt="" className="w-9 h-9 rounded-full object-cover bg-white/20 p-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">SASBOT</p>
              <p className="text-[11px] text-white/80">Asistente virtual SST</p>
            </div>
            <button
              onClick={() => cargarHistorial(1)}
              disabled={cargandoHistorial}
              aria-label="Actualizar historial"
              className="disabled:opacity-50"
            >
              <RefreshCw size={15} className="text-white" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Banner de emergencia */}
          {modoEmergencia && (
            <div
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium border-b shrink-0"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: border }}
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span className="flex-1">Posible emergencia detectada.</span>
              <button onClick={escalar} disabled={escalando} className="underline font-semibold shrink-0 disabled:opacity-50">
                {escalando ? 'Enviando...' : 'Escalar a SST'}
              </button>
            </div>
          )}

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {cargandoHistorial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin" size={22} style={{ color: '#6366F1' }} />
              </div>
            ) : (
              <>
                {hayMasHistorial && (
                  <div className="flex justify-center pb-1">
                    <button
                      onClick={() => cargarHistorial(pagina + 1)}
                      disabled={cargandoMas}
                      className="flex items-center gap-1 text-xs font-semibold hover:underline disabled:opacity-50"
                      style={{ color: '#6366F1' }}
                    >
                      <ChevronUp size={12} />
                      {cargandoMas ? 'Cargando...' : 'Mensajes anteriores'}
                    </button>
                  </div>
                )}

                {mensajes.length === 0 && (
                  <MensajeBurbuja
                    rol="bot"
                    texto="¡Hola! Soy SASBOT, tu asistente de seguridad y salud en el trabajo. ¿En qué puedo ayudarte hoy?"
                    theme={theme}
                  />
                )}

                {mensajes.map((m, i) => (
                  <MensajeBurbuja key={i} {...m} theme={theme} />
                ))}

                {enviando && <MensajeBurbuja rol="bot" cargando theme={theme} />}
              </>
            )}
          </div>

          {/* Error de archivo */}
          {archivoError && (
            <div className="px-3 pb-1 shrink-0">
              <p className="text-[11px]" style={{ color: '#EF4444' }}>{archivoError}</p>
            </div>
          )}

          {/* Reporte rápido */}
          {mostrarReporte && (
            <ReporteRapidoForm
              form={reporteForm}
              setForm={setReporteForm}
              onSubmit={enviarReporte}
              onCancel={() => setMostrarReporte(false)}
              enviando={enviandoReporte}
              theme={theme}
            />
          )}

          {/* Input */}
          <div className="border-t p-2 flex items-center gap-1.5 shrink-0" style={{ borderColor: border }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={enviando}
              title="Adjuntar archivo"
              className="p-2 rounded-lg shrink-0 disabled:opacity-50"
              style={{ color: sub }}
            >
              <Paperclip size={17} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={seleccionarArchivo}
            />
            <button
              onClick={() => setMostrarReporte((v) => !v)}
              title="Reporte rápido"
              className="p-2 rounded-lg shrink-0"
              style={{ color: mostrarReporte ? '#6366F1' : sub }}
            >
              <ClipboardList size={17} />
            </button>
            <input
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={manejarTeclaInput}
              placeholder="Escribe un mensaje..."
              className="flex-1 min-w-0 text-sm rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}
            />
            <button
              onClick={enviarMensaje}
              disabled={enviando || !inputTexto.trim()}
              className="p-2 rounded-lg shrink-0 text-white disabled:opacity-50"
              style={{ backgroundColor: '#6366F1' }}
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition hover:opacity-90 overflow-hidden"
        style={{ backgroundColor: '#6366F1' }}
        aria-label={open ? 'Cerrar SASBOT' : 'Abrir SASBOT'}
      >
        {open
          ? <X size={24} className="text-white" />
          : <img src={casco} alt="SASBOT" className="w-9 h-9 object-contain" />}
      </button>
    </div>
  )
}
