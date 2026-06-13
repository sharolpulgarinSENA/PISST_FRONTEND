import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTema } from './EmpleadoLayout'
import { incidentesAPI } from '../../../services/api'
import {
  AlertTriangle, CheckCircle, ChevronLeft, Plus, Trash2
} from 'lucide-react'

/* ─── Opciones según enums del backend ─── */
const TIPOS = [
  { value: 'accidente',          label: 'Accidente de trabajo'   },
  { value: 'incidente',          label: 'Incidente'              },
  { value: 'cuasi_accidente',    label: 'Cuasi accidente'        },
  { value: 'condicion_insegura', label: 'Condición insegura'     },
]

const SEVERIDADES = [
  { value: 'sin_lesion', label: 'Sin lesión'  },
  { value: 'leve',       label: 'Leve'        },
  { value: 'moderada',   label: 'Moderada'    },
  { value: 'grave',      label: 'Grave'       },
  { value: 'mortal',     label: 'Mortal'      },
]

const PARTES_CUERPO = [
  'Cabeza', 'Cuello', 'Hombro', 'Brazo', 'Codo', 'Antebrazo',
  'Muñeca', 'Mano', 'Dedos mano', 'Tórax', 'Abdomen', 'Espalda',
  'Columna', 'Cadera', 'Muslo', 'Rodilla', 'Pierna', 'Tobillo',
  'Pie', 'Dedos pie', 'Ojos', 'Oídos', 'Otro'
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
  const navigate = useNavigate()

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
        height: 'calc(100vh - 60px)', backgroundColor: tk.bg
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
      height: 'calc(100vh - 60px)', overflowY: 'auto',
      backgroundColor: tk.bg, color: tk.text
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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
              Nuevo reporte de incidente
            </h1>
            <p style={{ fontSize: 12, color: tk.textFaint, margin: 0, marginTop: 2 }}>
              Completa todos los campos obligatorios marcados con *
            </p>
          </div>
        </div>

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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, marginBottom: 20, marginTop: 0 }}>
            📋 Datos del incidente
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

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
            <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, margin: 0 }}>
              🩹 Información de lesión
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  {PARTES_CUERPO.map(p => <option key={p} value={p}>{p}</option>)}
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
            <h2 style={{ fontSize: 15, fontWeight: 700, color: tk.text, margin: 0 }}>
              👥 Testigos <span style={{ fontSize: 12, fontWeight: 400, color: tk.textFaint }}>(opcional)</span>
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
            <div key={i} style={{
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
                style={{
                  padding: '10px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid rgba(239,68,68,0.3)`,
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  color: '#EF4444', display: 'flex', alignItems: 'center'
                }}>
                <Trash2 size={14} />
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
            {enviando ? 'Enviando...' : '✓ Enviar reporte'}
          </button>
        </div>

      </div>
    </div>
  )
}