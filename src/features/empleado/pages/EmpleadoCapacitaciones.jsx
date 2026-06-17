import { useState, useEffect, useMemo } from 'react'
import { useTema } from './EmpleadoLayout'
import {
  GraduationCap, CheckCircle, XCircle, Download,
  ChevronRight, ChevronLeft, Clock, Award, BookOpen,
  BarChart2, AlertCircle, Loader, RefreshCw, FileText
} from 'lucide-react'
import { capacitacionesAPI } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import Spinner from '../../../components/Spinner'

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


function EstadoBadge({ aprobado }) {
  return aprobado
    ? <Badge texto="Aprobado" color="#22C55E" bg="rgba(34,197,94,0.1)" />
    : <Badge texto="No aprobado" color="#EF4444" bg="rgba(239,68,68,0.1)" />
}

/* ── Estado de la sesión (programada/realizada/no_realizada/cancelada/pendiente) ── */
function estadoSesion(fila) {
  const estado = fila.estado || fila.sesion_estado || 'programada'
  if (estado === 'cancelada')    return { label: 'Cancelada',    color: '#CBD5E1', bg: 'rgba(107,114,128,0.15)' }
  if (estado === 'realizada')    return { label: 'Realizada',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   }
  if (estado === 'no_realizada') return { label: 'No realizada', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   }
  if (!fila.fecha_sesion) return { label: 'Programada', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' }
  const normalized = normFecha(fila.fecha_sesion)
  const esPasada = new Date(normalized) < new Date()
  if (esPasada) return { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Programada', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' }
}

/* ── Fila de una sesión dentro de una capacitación expandida ── */
function SesionRow({ fila, tk, onEvaluacion, onCertificado }) {
  const tieneEval   = !!fila.evaluacion_id
  const aprobado    = fila.resultado?.aprobado
  const yaRespondio = fila.resultado !== null && fila.resultado !== undefined
  const estado      = estadoSesion(fila)
  const estadoBase  = fila.estado || fila.sesion_estado || 'programada'
  const puedeConfirmarAsistencia = ['programada', 'pendiente'].includes(estadoBase)
  const [asistencia, setAsistencia] = useState('idle') // idle | enviando | ok | error

  const confirmarAsistencia = async () => {
    setAsistencia('enviando')
    try {
      await capacitacionesAPI.registrarAsistenciaPropia(fila.sesion_id)
      setAsistencia('ok')
    } catch {
      setAsistencia('error')
    }
  }

  return (
    <div className="ecap-sesion-row" style={{
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14,
      borderTop: `1px solid ${tk.border}`, flexWrap: 'wrap'
    }}>
      {/* Icono */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        backgroundColor: aprobado === true
          ? 'rgba(34,197,94,0.12)'
          : aprobado === false
            ? 'rgba(239,68,68,0.1)'
            : 'rgba(99,102,241,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {aprobado === true
          ? <Award size={16} color="#22C55E" />
          : aprobado === false
            ? <XCircle size={16} color="#EF4444" />
            : <Clock size={16} color="#818CF8" />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: tk.text }}>
            {fila.fecha_sesion
              ? new Date(/[Z+-]\d{2}:\d{2}$|Z$/.test(fila.fecha_sesion) ? fila.fecha_sesion : fila.fecha_sesion + 'Z')
                  .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
              : 'Sin fecha'}
          </span>
          {tieneEval && !yaRespondio
            ? <Badge texto="Evaluación pendiente" color="#F59E0B" bg="rgba(245,158,11,0.1)" />
            : <Badge texto={estado.label} color={estado.color} bg={estado.bg} />
          }
          {yaRespondio && <EstadoBadge aprobado={aprobado} />}
        </div>
        {yaRespondio && (
          <div style={{ fontSize: 12, color: tk.textFaint, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <BarChart2 size={11} />
            {fila.resultado.puntaje_final ?? '—'}% — {fila.resultado.respuestas_correctas}/{fila.resultado.total_preguntas} correctas
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="ecap-sesion-acciones" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        {puedeConfirmarAsistencia && asistencia !== 'ok' && (
          <button
            onClick={confirmarAsistencia}
            disabled={asistencia === 'enviando'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, cursor: asistencia === 'enviando' ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(99,102,241,0.4)',
              backgroundColor: 'rgba(99,102,241,0.1)',
              color: '#818CF8', fontSize: 12, fontWeight: 500,
              opacity: asistencia === 'enviando' ? 0.6 : 1
            }}
          >
            {asistencia === 'enviando'
              ? <><Loader size={13} className="motion-safe:animate-spin" /> Confirmando...</>
              : asistencia === 'error'
                ? <><AlertCircle size={13} /> Reintentar asistencia</>
                : <><CheckCircle size={13} /> Confirmar asistencia</>
            }
          </button>
        )}
        {asistencia === 'ok' && (
          <Badge texto="Asistencia confirmada" color="#22C55E" bg="rgba(34,197,94,0.1)" />
        )}
        {aprobado && (
          <button
            onClick={() => onCertificado(fila)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(34,197,94,0.4)',
              backgroundColor: 'rgba(34,197,94,0.08)',
              color: '#22C55E', fontSize: 12, fontWeight: 500
            }}
          >
            <Download size={13} /> Certificado
          </button>
        )}
        {tieneEval && !yaRespondio && (
          <button
            onClick={() => onEvaluacion(fila)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
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
}

export default function EmpleadoCapacitaciones() {
  const { tk }      = useTema()
  const { user }    = useAuth()
  const empleadoId  = user?.id

  const [vista,        setVista]        = useState('historial')  // 'historial' | 'evaluacion' | 'resultado'
  const [historial,    setHistorial]    = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [errorGlobal,  setErrorGlobal]  = useState(null)
  const [expandidos,   setExpandidos]   = useState(new Set())

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
  const [errorCert,    setErrorCert]    = useState(null)

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

  /* ── Agrupar el historial (por sesión) en capacitaciones ── */
  const capacitaciones = useMemo(() => {
    const grupos = new Map()
    historial.forEach(fila => {
      const key = fila.capacitacion_id ?? fila.capacitacion_nombre ?? 'sin-id'
      if (!grupos.has(key)) {
        grupos.set(key, {
          id: key,
          nombre: fila.capacitacion_nombre || 'Capacitación',
          activo: fila.capacitacion_activo ?? fila.activo ?? true,
          sesiones: []
        })
      }
      // Filas "placeholder" (capacitación sin ninguna sesión creada todavía):
      // fecha_sesion/estado/evaluacion_id vienen todos en null. No se
      // muestran como sesión, solo sirven para que la capacitación aparezca.
      const esPlaceholder = !fila.fecha_sesion && !fila.estado && !fila.sesion_estado && !fila.evaluacion_id
      if (!esPlaceholder) {
        grupos.get(key).sesiones.push(fila)
      }
    })
    return Array.from(grupos.values()).map(g => ({
      ...g,
      sesiones: g.sesiones.slice().sort((a, b) => {
        const fa = a.fecha_sesion ? new Date(a.fecha_sesion) : new Date(0)
        const fb = b.fecha_sesion ? new Date(b.fecha_sesion) : new Date(0)
        return fb - fa
      })
    }))
  }, [historial])

  const toggleExpandido = (id) => {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
  const descargarCertificado = async (fila) => {
    const objetivo = fila || sesionActual
    if (!objetivo?.evaluacion_id) return
    setSesionActual(objetivo)
    setDescargando(true)
    setErrorCert(null)
    try {
      const res = await capacitacionesAPI.getCertificado(objetivo.evaluacion_id, empleadoId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado_${objetivo.capacitacion_nombre || 'capacitacion'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErrorCert('No se pudo descargar el certificado. Asegúrate de haber aprobado la evaluación.')
    } finally {
      setDescargando(false)
    }
  }

  /* ────────── RENDER HISTORIAL ────────── */
  if (vista === 'historial') return (
    <div className="ecap-container" style={{ padding: 28, maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .ecap-container { overflow-x: hidden; }
        @media (max-width: 640px) {
          .ecap-container { padding: 16px !important; }
          .ecap-sesion-row { flex-direction: column; align-items: flex-start !important; }
          .ecap-sesion-acciones { width: 100%; }
          .ecap-sesion-acciones button { flex: 1; justify-content: center; }
        }
      `}</style>

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
      {errorCert && !cargando && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', fontSize: 13
        }}>
          <AlertCircle size={16} />
          {errorCert}
          <button onClick={() => setErrorCert(null)} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#EF4444', fontSize: 12, cursor: 'pointer'
          }}>
            Cerrar
          </button>
        </div>
      )}
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

      {/* Resumen evaluaciones pendientes */}
      {!cargando && !errorGlobal && capacitaciones.length > 0 && (() => {
        const totalPendientes = capacitaciones.reduce((acc, g) =>
          acc + g.sesiones.filter(s => s.evaluacion_id && (s.resultado === null || s.resultado === undefined)).length, 0)
        return totalPendientes > 0 ? (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B', fontSize: 13
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            Tienes <strong style={{ marginLeft: 4, marginRight: 4 }}>{totalPendientes}</strong>
            evaluación{totalPendientes > 1 ? 'es' : ''} pendiente{totalPendientes > 1 ? 's' : ''} por completar.
          </div>
        ) : null
      })()}

      {/* Lista de capacitaciones */}
      {!cargando && !errorGlobal && (
        capacitaciones.length === 0
          ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: tk.textFaint, fontSize: 14
            }}>
              <BookOpen size={40} color={tk.border} style={{ marginBottom: 12 }} />
              <p style={{ margin: 0 }}>Aún no tienes capacitaciones asignadas.</p>
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {capacitaciones.map(grupo => {
                const expandido = expandidos.has(grupo.id)
                const pendientes = grupo.sesiones.filter(f =>
                  f.evaluacion_id && (f.resultado === null || f.resultado === undefined)
                ).length

                return (
                  <div key={grupo.id} style={{
                    borderRadius: 12, backgroundColor: tk.card,
                    border: `1px solid ${tk.border}`, overflow: 'hidden'
                  }}>
                    {/* Encabezado de la capacitación */}
                    <div
                      onClick={() => toggleExpandido(grupo.id)}
                      style={{
                        padding: '16px 20px', display: 'flex', alignItems: 'center',
                        gap: 16, cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        backgroundColor: 'rgba(99,102,241,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <GraduationCap size={20} color="#818CF8" />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: tk.text }}>
                            {grupo.nombre}
                          </span>
                          {!grupo.activo && (
                            <Badge texto="Suspendida" color="#CBD5E1" bg="rgba(107,114,128,0.15)" />
                          )}
                          {pendientes > 0 && (
                            <Badge
                              texto={`${pendientes} evaluación${pendientes > 1 ? 'es' : ''} pendiente${pendientes > 1 ? 's' : ''}`}
                              color="#F59E0B" bg="rgba(245,158,11,0.1)"
                            />
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: tk.textFaint, marginTop: 4 }}>
                          {grupo.sesiones.length === 0
                            ? 'Sin sesiones programadas'
                            : `${grupo.sesiones.length} sesión${grupo.sesiones.length > 1 ? 'es' : ''}`}
                        </div>
                      </div>

                      <ChevronRight size={18} color={tk.textFaint} style={{
                        flexShrink: 0, transition: 'transform 0.15s',
                        transform: expandido ? 'rotate(90deg)' : 'none'
                      }} />
                    </div>

                    {/* Sesiones de la capacitación */}
                    {expandido && (
                      grupo.sesiones.length === 0 ? (
                        <div style={{ padding: '12px 20px', borderTop: `1px solid ${tk.border}`, fontSize: 13, color: tk.textFaint }}>
                          Aún no se ha programado ninguna sesión para esta capacitación.
                        </div>
                      ) : grupo.sesiones.map((fila, i) => (
                        <SesionRow
                          key={i} fila={fila} tk={tk}
                          onEvaluacion={abrirEvaluacion}
                          onCertificado={descargarCertificado}
                        />
                      ))
                    )}
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
          color: tk.navColor, fontSize: 13, marginBottom: 20, padding: 0,
          fontWeight: 600,
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
                ? <><Loader size={14} className="motion-safe:animate-spin" /> Enviando...</>
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

        {/* Error certificado */}
        {errorCert && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left'
          }}>
            <AlertCircle size={14} /> {errorCert}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resultado?.aprobado && (
            <button
              onClick={() => descargarCertificado(sesionActual)}
              disabled={descargando}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {descargando
                ? <><Loader size={15} className="motion-safe:animate-spin" /> Descargando...</>
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