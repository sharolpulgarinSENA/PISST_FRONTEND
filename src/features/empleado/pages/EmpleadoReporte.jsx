import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTema } from './EmpleadoLayout'
import { useAuth } from '../../../context/AuthContext'
import { incidentesAPI, getErrorMessage } from '../../../services/api'
import { normFecha, fmtFecha } from '../../../utils/dates'
import Spinner from '../../../components/Spinner'
import {
  AlertTriangle, CheckCircle, ChevronLeft, Plus, Trash2, Loader, ClipboardList, Bandage, Users, Send
} from 'lucide-react'


/* Busca el primer campo no vacío entre varios nombres posibles del backend */
function campoReporte(reporte, candidatos) {
  for (const c of candidatos) {
    if (reporte[c] !== undefined && reporte[c] !== null && reporte[c] !== '') return reporte[c]
  }
  return null
}

const ESTADO_REPORTE = {
  borrador:         { label: 'Borrador',        color: '#CBD5E1', bg: 'rgba(156,163,175,0.12)' },
  en_revision:      { label: 'En revisión',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  abierto:          { label: 'Abierto',         color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  en_investigacion: { label: 'En investigación', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  cerrado:          { label: 'Cerrado',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
}

const SEVERIDAD_LABEL = {
  sin_lesion: 'Sin lesión', leve: 'Leve', moderada: 'Moderada', grave: 'Grave', mortal: 'Mortal',
}

function Badge({ texto, color, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px',
      borderRadius: 20, color, backgroundColor: bg,
      border: `1px solid ${color}33`, whiteSpace: 'nowrap'
    }}>{texto}</span>
  )
}

/* ─── Opciones según enums del backend ─── */
const TIPOS = [
  { value: 'accidente',          label: 'Accidente de trabajo'   },
  { value: 'incidente',          label: 'Incidente'              },
  { value: 'cuasi_accidente',    label: 'Cuasi Accidente'        },
  { value: 'condicion_insegura', label: 'Condición insegura'     },
]

const SEVERIDADES = [
  { value: 'sin_lesion', label: 'Sin lesión'  },
  { value: 'leve',       label: 'Leve'        },
  { value: 'moderada',   label: 'Moderada'    },
  { value: 'grave',      label: 'Grave'       },
  { value: 'mortal',     label: 'Mortal'      },
]

const PARTES_CUERPO_GRUPOS = [
  { grupo: 'Cabeza y cuello',   opciones: ['Cabeza', 'Cuello', 'Ojos', 'Oídos'] },
  { grupo: 'Tronco',            opciones: ['Tórax', 'Abdomen', 'Espalda', 'Columna'] },
  { grupo: 'Extremidad superior', opciones: ['Hombro', 'Brazo', 'Codo', 'Antebrazo', 'Muñeca', 'Mano', 'Dedos mano'] },
  { grupo: 'Extremidad inferior', opciones: ['Cadera', 'Muslo', 'Rodilla', 'Pierna', 'Tobillo', 'Pie', 'Dedos pie'] },
  { grupo: 'Otro',              opciones: ['Otro'] },
]

/* ─── Componente campo ─── */
function Campo({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'inherit' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>}
    </div>
  )
}

export default function EmpleadoReporte() {
  const { tk }   = useTema()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  /* ── Pestaña activa: 'nuevo' | 'mis' ── */
  const [vista, setVista] = useState(searchParams.get('vista') === 'mis' ? 'mis' : 'nuevo')
  const [misReportes,  setMisReportes]  = useState([])
  const [cargandoMios, setCargandoMios] = useState(false)
  const [errorMios,    setErrorMios]    = useState(null)

  const cargarMisReportes = () => {
    setCargandoMios(true)
    setErrorMios(null)
    incidentesAPI.getAll()
      .then(res => {
        const todos = res.data || []
        const propios = todos.filter(r => {
          const creadorId = campoReporte(r, ['creado_por_id', 'usuario_id', 'reportado_por_id'])
          if (creadorId) return String(creadorId) === String(user?.id)
          const creadorNombre = campoReporte(r, ['creado_por_nombre', 'usuario_nombre', 'reportado_por_nombre', 'reportado_por'])
          return creadorNombre && creadorNombre === user?.nombre
        })
        setMisReportes(propios)
      })
      .catch(err => setErrorMios(getErrorMessage(err, 'No se pudieron cargar tus reportes.')))
      .finally(() => setCargandoMios(false))
  }

  const irAMisReportes = () => { setVista('mis'); cargarMisReportes() }

  /* Deep link desde notificaciones: /empleado/reporte?vista=mis */
  useEffect(() => {
    if (searchParams.get('vista') === 'mis') {
      cargarMisReportes()
      setSearchParams({})
    }
  }, [])

  /* ── Estado del formulario ── */
  const [form, setForm] = useState({
    tipo:        '',
    severidad:   'sin_lesion',
    fecha:       new Date().toISOString().slice(0, 16), // datetime-local format
    lugar:       '',
    descripcion: '',
    // lesión opcional
    con_lesion:      false,
    tipo_lesion:     '',
    parte_afectada:  '',
    incapacidad_dias: 0,
    // testigos
    testigos: [],   // [{ nombre, relato }]
  })

  const [errores,  setErrores]  = useState({})
  const [enviando, setEnviando] = useState(false)
  const [exito,    setExito]    = useState(null)   // { id, tipo }
  const [errorApi, setErrorApi] = useState(null)

  /* ── Helpers ── */
  const set = (campo, valor) => {
    setForm(p => ({ ...p, [campo]: valor }))
    setErrores(p => ({ ...p, [campo]: null }))
  }

  const addTestigo = () =>
    setForm(p => ({ ...p, testigos: [...p.testigos, { nombre: '', relato: '' }] }))

  const removeTestigo = (i) =>
    setForm(p => ({ ...p, testigos: p.testigos.filter((_, idx) => idx !== i) }))

  const setTestigo = (i, campo, valor) =>
    setForm(p => ({
      ...p,
      testigos: p.testigos.map((t, idx) => idx === i ? { ...t, [campo]: valor } : t)
    }))

  /* ── Validación ── */
  const validar = () => {
    const e = {}
    if (!form.tipo)        e.tipo        = 'Selecciona el tipo de incidente'
    if (!form.severidad)   e.severidad   = 'Selecciona la severidad'
    if (!form.fecha)       e.fecha       = 'Ingresa la fecha del incidente'
    if (!form.lugar.trim()) e.lugar      = 'Ingresa el lugar del incidente'
    if (!form.descripcion.trim()) e.descripcion = 'Describe lo ocurrido'
    if (form.descripcion.trim().length < 20)
      e.descripcion = 'La descripción debe tener al menos 20 caracteres'
    if (form.con_lesion && !form.parte_afectada)
      e.parte_afectada = 'Indica la parte del cuerpo afectada'
    form.testigos.forEach((t, i) => {
      if (!t.nombre.trim()) e[`testigo_${i}`] = 'El nombre del testigo es requerido'
    })
    setErrores(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validar()) return
    setEnviando(true)
    setErrorApi(null)

    // Construir payload según IncidenteCreate del backend
    const payload = {
      tipo:        form.tipo,
      severidad:   form.severidad,
      fecha:       new Date(form.fecha).toISOString(),
      lugar:       form.lugar.trim(),
      descripcion: form.descripcion.trim(),
      // lesión solo si el empleado marcó que hubo
      lesion: form.con_lesion ? {
        tipo_lesion:     form.tipo_lesion || null,
        parte_afectada:  form.parte_afectada || null,
        incapacidad_dias: Number(form.incapacidad_dias) || 0
      } : null,
      // testigos solo los que tienen nombre
      testigos: form.testigos
        .filter(t => t.nombre.trim())
        .map(t => ({ nombre: t.nombre.trim(), relato: t.relato.trim() || null }))
    }

    try {
      const res = await incidentesAPI.create(payload)
      setExito({ id: res.data?.id, tipo: form.tipo })
    } catch (err) {
      const detalle = err.response?.data?.detail
      setErrorApi(
        typeof detalle === 'string'
          ? detalle
          : Array.isArray(detalle)
            ? detalle.map(d => d.msg).join(' | ')
            : 'Error al enviar el reporte. Intenta de nuevo.'
      )
    } finally {
      setEnviando(false)
    }
  }

  /* ── Estilos reutilizables ── */
  const inputStyle = (campo) => ({
    padding: '10px 12px', borderRadius: 8, fontSize: 14,
    border: `1px solid ${errores[campo] ? '#EF4444' : tk.border}`,
    backgroundColor: tk.bg, color: tk.text,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit'
  })

  const selectStyle = (campo) => ({
    ...inputStyle(campo),
    cursor: 'pointer', appearance: 'none'
  })

  /* ── Pantalla de éxito ── */
  if (exito) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', backgroundColor: tk.bg
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 480, padding: 40,
          backgroundColor: tk.card, borderRadius: 16,
          border: `1px solid ${tk.border}`
        }}>
          <CheckCircle size={56} color="#22C55E" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: tk.text, marginBottom: 8 }}>
            Reporte enviado exitosamente
          </h2>
          <p style={{ fontSize: 14, color: tk.textMuted, marginBottom: 6 }}>
            Tu reporte de <strong>{TIPOS.find(t => t.value === exito.tipo)?.label}</strong> ha sido registrado.
          </p>
          {exito.id && (
            <p style={{ fontSize: 12, color: tk.textFaint, marginBottom: 24 }}>
              ID de referencia: <code style={{ color: '#818CF8' }}>{String(exito.id).slice(0, 8).toUpperCase()}</code>
            </p>
          )}
          <p style={{ fontSize: 13, color: tk.textFaint, marginBottom: 28, lineHeight: 1.6 }}>
            El Encargado SST ha sido notificado y revisará tu reporte a la brevedad.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => { setExito(null); setForm({ tipo: '', severidad: 'sin_lesion', fecha: new Date().toISOString().slice(0,16), lugar: '', descripcion: '', con_lesion: false, tipo_lesion: '', parte_afectada: '', incapacidad_dias: 0, testigos: [] }) }}
              style={{
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
                color: tk.textMuted, fontSize: 13
              }}>
              Nuevo reporte
            </button>
            <button
              onClick={() => { setExito(null); irAMisReportes() }}
              style={{
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
                color: tk.textMuted, fontSize: 13
              }}>
              Ver mis reportes
            </button>
            <button
              onClick={() => navigate('/empleado/chat')}
              style={{
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color: '#fff', fontSize: 13, fontWeight: 600
              }}>
              Ir al chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Formulario principal ── */
  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      backgroundColor: tk.bg, color: tk.text
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate('/empleado/chat')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8,
              border: `1px solid ${tk.border}`, backgroundColor: tk.card,
              color: tk.textMuted, fontSize: 13, cursor: 'pointer'
            }}>
            <ChevronLeft size={15} /> Volver
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: tk.text, margin: 0 }}>
              {vista === 'nuevo' ? 'Nuevo reporte de incidente' : 'Mis reportes'}
            </h1>
            <p style={{ fontSize: 12, color: tk.textFaint, margin: 0, marginTop: 2 }}>
              {vista === 'nuevo'
                ? 'Completa todos los campos obligatorios marcados con *'
                : 'Reportes de incidentes que has enviado y su estado actual'}
            </p>
          </div>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${tk.border}` }}>
          {[
            { id: 'nuevo', label: 'Nuevo reporte', icon: Plus },
            { id: 'mis',   label: 'Mis reportes',  icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => id === 'mis' ? irAMisReportes() : setVista(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', marginBottom: -1,
              border: 'none', borderBottom: `2px solid ${vista === id ? '#6366F1' : 'transparent'}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              color: vista === id ? '#818CF8' : tk.textMuted,
              fontSize: 13, fontWeight: vista === id ? 600 : 400
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {vista === 'mis' ? (
          <MisReportes
            tk={tk}
            cargando={cargandoMios}
            error={errorMios}
            reportes={misReportes}
            onReintentar={cargarMisReportes}
          />
        ) : (
        <>
        {/* Error API */}
        {errorApi && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)'
          }}>
            <AlertTriangle size={16} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#EF4444' }}>{errorApi}</span>
          </div>
        )}

        {/* ── Sección 1: Datos básicos ── */}
        <section style={{
          backgroundColor: tk.card, border: `1px solid ${tk.border}`,
          borderRadius: 12, padding: 24, marginBottom: 16
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, marginBottom: 20, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={16} /> Datos del incidente
          </h2>
          <div className="empleado-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <Campo label="Tipo de incidente" required error={errores.tipo}>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={selectStyle('tipo')}>
                <option value="">Seleccionar...</option>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Campo>

            <Campo label="Severidad" required error={errores.severidad}>
              <select value={form.severidad} onChange={e => set('severidad', e.target.value)} style={selectStyle('severidad')}>
                {SEVERIDADES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Campo>

            <Campo label="Fecha y hora del incidente" required error={errores.fecha}>
              <div style={{ position: 'relative' }}>
                <input
                  type="datetime-local"
                  value={form.fecha}
                  onChange={e => set('fecha', e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  style={inputStyle('fecha')}
                />
              </div>
            </Campo>

            <Campo label="Lugar del incidente" required error={errores.lugar}>
              <input
                type="text"
                value={form.lugar}
                onChange={e => set('lugar', e.target.value)}
                placeholder="Ej: Bodega 3, piso 2, área de cargue"
                style={inputStyle('lugar')}
              />
            </Campo>

            <div style={{ gridColumn: '1 / -1' }}>
              <Campo label="Descripción de lo ocurrido" required error={errores.descripcion}>
                <textarea
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  placeholder="Describe detalladamente qué sucedió, cómo ocurrió y cuáles fueron las circunstancias..."
                  rows={4}
                  style={{ ...inputStyle('descripcion'), resize: 'vertical', lineHeight: 1.6 }}
                />
                <span style={{ fontSize: 11, color: form.descripcion.length < 20 ? '#EF4444' : tk.textFaint, textAlign: 'right' }}>
                  {form.descripcion.length} caracteres (mínimo 20)
                </span>
              </Campo>
            </div>
          </div>
        </section>

        {/* ── Sección 2: Lesión (opcional) ── */}
        <section style={{
          backgroundColor: tk.card, border: `1px solid ${tk.border}`,
          borderRadius: 12, padding: 24, marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.con_lesion ? 20 : 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bandage size={16} /> Información de lesión
            </h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: tk.textMuted }}>
              <input
                type="checkbox"
                checked={form.con_lesion}
                onChange={e => set('con_lesion', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366F1' }}
              />
              Hubo lesión física
            </label>
          </div>

          {form.con_lesion && (
            <div className="empleado-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Campo label="Tipo de lesión" error={errores.tipo_lesion}>
                <input
                  type="text"
                  value={form.tipo_lesion}
                  onChange={e => set('tipo_lesion', e.target.value)}
                  placeholder="Ej: Fractura, contusión, laceración..."
                  style={inputStyle('tipo_lesion')}
                />
              </Campo>

              <Campo label="Parte del cuerpo afectada" required error={errores.parte_afectada}>
                <select
                  value={form.parte_afectada}
                  onChange={e => set('parte_afectada', e.target.value)}
                  style={selectStyle('parte_afectada')}>
                  <option value="">Seleccionar...</option>
                  {PARTES_CUERPO_GRUPOS.map(g => (
                    <optgroup key={g.grupo} label={g.grupo}>
                      {g.opciones.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Campo>

              <Campo label="Días de incapacidad estimados" error={errores.incapacidad_dias}>
                <input
                  type="number"
                  min={0}
                  value={form.incapacidad_dias}
                  onChange={e => set('incapacidad_dias', e.target.value)}
                  style={inputStyle('incapacidad_dias')}
                />
              </Campo>
            </div>
          )}
        </section>

        {/* ── Sección 3: Testigos (opcional) ── */}
        <section style={{
          backgroundColor: tk.card, border: `1px solid ${tk.border}`,
          borderRadius: 12, padding: 24, marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.testigos.length > 0 ? 16 : 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} /> Testigos <span style={{ fontSize: 12, fontWeight: 400, color: tk.textFaint }}>(opcional)</span>
            </h2>
            <button
              onClick={addTestigo}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${tk.border}`, backgroundColor: tk.sidebar,
                color: tk.textMuted, fontSize: 12
              }}>
              <Plus size={13} /> Agregar testigo
            </button>
          </div>

          {form.testigos.map((t, i) => (
            <div key={i} className="empleado-form-grid-3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr auto',
              gap: 12, alignItems: 'end',
              padding: '12px 0',
              borderBottom: i < form.testigos.length - 1 ? `1px solid ${tk.border}` : 'none'
            }}>
              <Campo label={`Testigo ${i + 1} — Nombre`} error={errores[`testigo_${i}`]}>
                <input
                  type="text"
                  value={t.nombre}
                  onChange={e => setTestigo(i, 'nombre', e.target.value)}
                  placeholder="Nombre completo"
                  style={inputStyle(`testigo_${i}`)}
                />
              </Campo>
              <Campo label="Relato breve">
                <input
                  type="text"
                  value={t.relato}
                  onChange={e => setTestigo(i, 'relato', e.target.value)}
                  placeholder="Qué observó el testigo"
                  style={inputStyle(null)}
                />
              </Campo>
              <button
                onClick={() => removeTestigo(i)}
                aria-label={`Eliminar testigo ${i + 1}`}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid rgba(239,68,68,0.3)`,
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap'
                }}>
                <Trash2 size={13} />
                <span>Eliminar</span>
              </button>
            </div>
          ))}
        </section>

        {/* ── Botones de acción ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate('/empleado/chat')}
            style={{
              padding: '11px 24px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${tk.border}`, backgroundColor: tk.card,
              color: tk.textMuted, fontSize: 14
            }}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={enviando}
            style={{
              padding: '11px 28px', borderRadius: 9, cursor: enviando ? 'not-allowed' : 'pointer',
              border: 'none',
              background: enviando ? tk.border : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              color: enviando ? tk.textFaint : '#fff',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            {enviando ? 'Enviando...' : <><Send size={14} /> Enviar reporte</>}
          </button>
        </div>
        </>
        )}

      </div>
    </div>
  )
}

/* ── Pestaña "Mis reportes": lista de reportes propios con su estado ── */
function MisReportes({ tk, cargando, error, reportes, onReintentar }) {
  if (cargando) return <Spinner />

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        padding: '40px 0', textAlign: 'center'
      }}>
        <AlertTriangle size={32} color="#EF4444" />
        <p style={{ fontSize: 13, color: tk.textMuted, margin: 0 }}>{error}</p>
        <button onClick={onReintentar} style={{
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${tk.border}`, backgroundColor: tk.card,
          color: tk.textMuted, fontSize: 13
        }}>
          Reintentar
        </button>
      </div>
    )
  }

  if (reportes.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '48px 0', textAlign: 'center'
      }}>
        <ClipboardList size={36} color={tk.textFaint} />
        <p style={{ fontSize: 13, color: tk.textFaint, margin: 0 }}>
          Aún no has enviado ningún reporte de incidente.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
      {reportes.map(r => {
        const estado = ESTADO_REPORTE[r.estado] || ESTADO_REPORTE.borrador
        return (
          <div key={r.id} style={{
            padding: 16, borderRadius: 12,
            backgroundColor: tk.card, border: `1px solid ${tk.border}`,
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: tk.text }}>
                {TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Badge texto={estado.label} color={estado.color} bg={estado.bg} />
                {r.severidad && (
                  <Badge texto={SEVERIDAD_LABEL[r.severidad] || r.severidad} color={tk.textMuted} bg={tk.sidebar} />
                )}
              </div>
            </div>
            {r.descripcion && (
              <p style={{
                fontSize: 12, color: tk.textFaint, margin: 0, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {r.descripcion}
              </p>
            )}
            <div style={{ fontSize: 12, color: tk.textFaint, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>{r.lugar}</span>
              <span>·</span>
              <span>{fmtFecha(r.fecha)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}