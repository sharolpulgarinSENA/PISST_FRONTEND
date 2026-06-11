import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from './EmpleadoLayout'
import {
  GraduationCap, CheckCircle, XCircle, Download,
  ChevronRight, ChevronLeft, Clock, Award, BookOpen,
  BarChart2, AlertCircle, Loader, RefreshCw, FileText
} from 'lucide-react'
import { capacitacionesAPI } from '../services/api'

/* ────────────────────────────────────────────────────────────────
   ESTADOS de la página:
   'historial'   → lista de asistencias del empleado
   'evaluacion'  → formulario de preguntas de una evaluación
   'resultado'   → pantalla de resultado tras responder
──────────────────────────────────────────────────────────────── */

function Badge({ texto, color, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px',
      borderRadius: 20, color, backgroundColor: bg,
      border: `1px solid ${color}33`, whiteSpace: 'nowrap'
    }}>{texto}</span>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Loader size={28} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function EstadoBadge({ aprobado }) {
  return aprobado
    ? <Badge texto="Aprobado" color="#22C55E" bg="rgba(34,197,94,0.1)" />
    : <Badge texto="No aprobado" color="#EF4444" bg="rgba(239,68,68,0.1)" />
}

export default function EmpleadoCapacitaciones() {
  const { user }  = useAuth()
  const { tk }    = useTema()
  const empleadoId = user?.id

  const [vista,        setVista]        = useState('historial')  // 'historial' | 'evaluacion' | 'resultado'
  const [historial,    setHistorial]    = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [errorGlobal,  setErrorGlobal]  = useState(null)

  // Evaluación activa
  const [evaluacionActual, setEvaluacionActual] = useState(null)   // objeto con preguntas
  const [sesionActual,     setSesionActual]     = useState(null)   // fila del historial seleccionada
  const [respuestas,       setRespuestas]       = useState({})     // { pregunta_id: respuesta_dada }
  const [preguntaIdx,      setPreguntaIdx]      = useState(0)
  const [enviando,         setEnviando]         = useState(false)
  const [errorEval,        setErrorEval]        = useState(null)

  // Resultado
  const [resultado,    setResultado]    = useState(null)  // { puntaje_final, aprobado, total_preguntas, respuestas_correctas }
  const [descargando,  setDescargando]  = useState(false)

  /* ── Cargar historial ── */
  const cargarHistorial = () => {
    setCargando(true)
    setErrorGlobal(null)
    capacitacionesAPI.getHistorialEmpleado(empleadoId)
      .then(res => setHistorial(res.data || []))
      .catch(err => {
        const det = err.response?.data?.detail || 'No se pudo cargar el historial.'
        setErrorGlobal(det)
      })
      .finally(() => setCargando(false))
  }

  useEffect(() => { if (empleadoId) cargarHistorial() }, [empleadoId])

  /* ── Abrir evaluación ── */
  const abrirEvaluacion = (fila) => {
    if (!fila.evaluacion_id) return
    setSesionActual(fila)
    setEvaluacionActual(fila.evaluacion)   // el historial trae el objeto evaluacion embebido
    setRespuestas({})
    setPreguntaIdx(0)
    setErrorEval(null)
    setVista('evaluacion')
  }

  /* ── Navegar preguntas ── */
  const preguntas = evaluacionActual?.preguntas || []
  const preguntaActual = preguntas[preguntaIdx]
  const totalPreguntas = preguntas.length
  const todasRespondidas = preguntas.every(p => respuestas[p.id] !== undefined)

  /* ── Enviar evaluación ── */
  const enviarEvaluacion = async () => {
    if (!todasRespondidas) { setErrorEval('Debes responder todas las preguntas.'); return }
    setEnviando(true)
    setErrorEval(null)
    try {
      const body = {
        evaluacion_id: evaluacionActual.id,
        respuestas: Object.entries(respuestas).map(([pregunta_id, respuesta_dada]) => ({
          pregunta_id,
          respuesta_dada
        }))
      }
      const res = await capacitacionesAPI.responderEvaluacion(body)
      setResultado(res.data)
      setVista('resultado')
      // refrescar historial en background
      capacitacionesAPI.getHistorialEmpleado(empleadoId)
        .then(r => setHistorial(r.data || []))
        .catch(() => {})
    } catch (err) {
      const det = err.response?.data?.detail || 'Error al enviar la evaluación. Intenta de nuevo.'
      setErrorEval(det)
    } finally {
      setEnviando(false)
    }
  }

  /* ── Descargar certificado ── */
  const descargarCertificado = async () => {
    if (!sesionActual?.evaluacion_id) return
    setDescargando(true)
    try {
      const res = await capacitacionesAPI.getCertificado(sesionActual.evaluacion_id, empleadoId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado_${sesionActual.capacitacion_nombre || 'capacitacion'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo descargar el certificado. Asegúrate de haber aprobado la evaluación.')
    } finally {
      setDescargando(false)
    }
  }

  /* ────────── RENDER HISTORIAL ────────── */
  if (vista === 'historial') return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: tk.text }}>Mis Capacitaciones</h1>
            <p style={{ margin: 0, fontSize: 13, color: tk.textFaint }}>Historial de asistencia, evaluaciones y certificados</p>
          </div>
        </div>
      </div>

      {/* Estado de carga / error */}
      {cargando && <Spinner />}
      {errorGlobal && !cargando && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', fontSize: 13
        }}>
          <AlertCircle size={16} />
          {errorGlobal}
          <button onClick={cargarHistorial} style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: '1px solid #EF444466', borderRadius: 6,
            padding: '4px 10px', color: '#EF4444', fontSize: 12, cursor: 'pointer'
          }}>
            <RefreshCw size={12} /> Reintentar
          </button>
        </div>
      )}

      {/* Lista historial */}
      {!cargando && !errorGlobal && (
        historial.length === 0
          ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: tk.textFaint, fontSize: 14
            }}>
              <BookOpen size={40} color={tk.border} style={{ marginBottom: 12 }} />
              <p style={{ margin: 0 }}>Aún no tienes capacitaciones registradas.</p>
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historial.map((fila, i) => {
                const tieneEval   = !!fila.evaluacion_id
                const aprobado    = fila.resultado?.aprobado
                const yaRespondio = fila.resultado !== null && fila.resultado !== undefined

                return (
                  <div key={i} style={{
                    padding: '16px 20px', borderRadius: 12,
                    backgroundColor: tk.card, border: `1px solid ${tk.border}`,
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'border-color 0.15s'
                  }}>
                    {/* Icono */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      backgroundColor: aprobado === true
                        ? 'rgba(34,197,94,0.12)'
                        : aprobado === false
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(99,102,241,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {aprobado === true
                        ? <Award size={20} color="#22C55E" />
                        : aprobado === false
                          ? <XCircle size={20} color="#EF4444" />
                          : <BookOpen size={20} color="#818CF8" />
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: tk.text }}>
                          {fila.capacitacion_nombre || 'Capacitación'}
                        </span>
                        {yaRespondio && <EstadoBadge aprobado={aprobado} />}
                        {tieneEval && !yaRespondio && (
                          <Badge texto="Evaluación pendiente" color="#F59E0B" bg="rgba(245,158,11,0.1)" />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: tk.textFaint, marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {fila.fecha_sesion
                            ? new Date(fila.fecha_sesion + 'Z').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
                            : 'Sin fecha'}
                        </span>
                        {yaRespondio && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BarChart2 size={11} />
                            {fila.resultado.puntaje_final ?? '—'}% — {fila.resultado.respuestas_correctas}/{fila.resultado.total_preguntas} correctas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {/* Descargar certificado */}
                      {aprobado && (
                        <button
                          onClick={() => { setSesionActual(fila); descargarCertificado() }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                            border: '1px solid rgba(34,197,94,0.4)',
                            backgroundColor: 'rgba(34,197,94,0.08)',
                            color: '#22C55E', fontSize: 12, fontWeight: 500
                          }}
                        >
                          <Download size={13} /> Certificado
                        </button>
                      )}
                      {/* Responder evaluación */}
                      {tieneEval && !yaRespondio && (
                        <button
                          onClick={() => abrirEvaluacion(fila)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                            border: '1px solid rgba(99,102,241,0.4)',
                            backgroundColor: 'rgba(99,102,241,0.1)',
                            color: '#818CF8', fontSize: 12, fontWeight: 500
                          }}
                        >
                          <FileText size={13} /> Hacer evaluación
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
      )}
    </div>
  )

  /* ────────── RENDER EVALUACIÓN ────────── */
  if (vista === 'evaluacion') return (
    <div style={{ padding: 28, maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <button
        onClick={() => setVista('historial')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: tk.textMuted, fontSize: 13, marginBottom: 20, padding: 0
        }}
      >
        <ChevronLeft size={16} /> Volver al historial
      </button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: tk.text }}>
          {evaluacionActual?.titulo || 'Evaluación'}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: tk.textFaint }}>
          {sesionActual?.capacitacion_nombre} · Puntaje mínimo: {evaluacionActual?.puntaje_minimo ?? '—'}%
        </p>
      </div>

      {/* Barra progreso */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tk.textFaint, marginBottom: 6 }}>
          <span>Pregunta {preguntaIdx + 1} de {totalPreguntas}</span>
          <span>{Math.round(((preguntaIdx + 1) / totalPreguntas) * 100)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 4, backgroundColor: tk.border, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${((preguntaIdx + 1) / totalPreguntas) * 100}%`,
            background: 'linear-gradient(90deg,#4F46E5,#7C3AED)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Tarjeta pregunta */}
      {preguntaActual && (
        <div style={{
          padding: '24px 24px', borderRadius: 14,
          backgroundColor: tk.card, border: `1px solid ${tk.border}`,
          marginBottom: 20
        }}>
          <p style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: tk.text, lineHeight: 1.5 }}>
            {preguntaActual.texto}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(preguntaActual.opciones || []).map((op, oi) => {
              // Soporta tanto { clave, texto } como string plano
              const clave = op?.clave ?? op
              const texto = op?.texto ?? op
              const seleccionada = respuestas[preguntaActual.id] === clave
              return (
                <button key={oi}
                  onClick={() => setRespuestas(p => ({ ...p, [preguntaActual.id]: clave }))}
                  style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${seleccionada ? '#6366F1' : tk.border}`,
                    backgroundColor: seleccionada ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: seleccionada ? '#A5B4FC' : tk.textMuted,
                    fontSize: 14, textAlign: 'left', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${seleccionada ? '#6366F1' : tk.border}`,
                    backgroundColor: seleccionada ? '#6366F1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {seleccionada && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} />}
                  </div>
                  {texto}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error evaluación */}
      {errorEval && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertCircle size={14} /> {errorEval}
        </div>
      )}

      {/* Navegación */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <button
          onClick={() => setPreguntaIdx(p => Math.max(0, p - 1))}
          disabled={preguntaIdx === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 9, cursor: preguntaIdx === 0 ? 'not-allowed' : 'pointer',
            border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
            color: preguntaIdx === 0 ? tk.textFaint : tk.textMuted, fontSize: 13, opacity: preguntaIdx === 0 ? 0.5 : 1
          }}
        >
          <ChevronLeft size={15} /> Anterior
        </button>

        {preguntaIdx < totalPreguntas - 1
          ? (
            <button
              onClick={() => setPreguntaIdx(p => p + 1)}
              disabled={respuestas[preguntaActual?.id] === undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 9,
                cursor: respuestas[preguntaActual?.id] === undefined ? 'not-allowed' : 'pointer',
                border: 'none',
                background: respuestas[preguntaActual?.id] !== undefined
                  ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : tk.border,
                color: respuestas[preguntaActual?.id] !== undefined ? '#fff' : tk.textFaint,
                fontSize: 13, fontWeight: 500,
                opacity: respuestas[preguntaActual?.id] === undefined ? 0.6 : 1
              }}
            >
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={enviarEvaluacion}
              disabled={!todasRespondidas || enviando}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 9,
                cursor: !todasRespondidas || enviando ? 'not-allowed' : 'pointer',
                border: 'none',
                background: todasRespondidas && !enviando
                  ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : tk.border,
                color: todasRespondidas && !enviando ? '#fff' : tk.textFaint,
                fontSize: 13, fontWeight: 600,
                opacity: !todasRespondidas || enviando ? 0.6 : 1
              }}
            >
              {enviando
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                : <><CheckCircle size={14} /> Enviar evaluación</>
              }
            </button>
          )
        }
      </div>
    </div>
  )

  /* ────────── RENDER RESULTADO ────────── */
  if (vista === 'resultado') return (
    <div style={{ padding: 28, maxWidth: 520, margin: '0 auto' }}>
      <div style={{
        padding: '36px 32px', borderRadius: 18, textAlign: 'center',
        backgroundColor: tk.card, border: `1px solid ${tk.border}`
      }}>
        {/* Icono resultado */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: resultado?.aprobado ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)'
        }}>
          {resultado?.aprobado
            ? <Award size={36} color="#22C55E" />
            : <XCircle size={36} color="#EF4444" />
          }
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: tk.text }}>
          {resultado?.aprobado ? '¡Felicitaciones!' : 'No aprobaste'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: tk.textFaint }}>
          {resultado?.aprobado
            ? 'Completaste la evaluación exitosamente.'
            : 'No alcanzaste el puntaje mínimo. Puedes volver a intentarlo.'}
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28
        }}>
          {[
            { label: 'Puntaje', valor: `${resultado?.puntaje_final ?? '—'}%` },
            { label: 'Correctas', valor: `${resultado?.respuestas_correctas ?? '—'}/${resultado?.total_preguntas ?? '—'}` },
            { label: 'Estado', valor: resultado?.aprobado ? 'Aprobado' : 'Reprobado',
              color: resultado?.aprobado ? '#22C55E' : '#EF4444' },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{
              padding: '12px 8px', borderRadius: 10,
              backgroundColor: tk.bg, border: `1px solid ${tk.border}`
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: color || tk.text }}>{valor}</div>
              <div style={{ fontSize: 11, color: tk.textFaint, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resultado?.aprobado && (
            <button
              onClick={descargarCertificado}
              disabled={descargando}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {descargando
                ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Descargando...</>
                : <><Download size={15} /> Descargar certificado PDF</>
              }
            </button>
          )}
          <button
            onClick={() => setVista('historial')}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${tk.border}`, backgroundColor: 'transparent',
              color: tk.textMuted, fontSize: 13
            }}
          >
            Volver al historial
          </button>
        </div>
      </div>
    </div>
  )

  return null
}