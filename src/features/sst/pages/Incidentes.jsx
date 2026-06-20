import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { Plus, X, Download, AlertTriangle, CheckCircle, Pencil, FileText, Search, ClipboardList } from 'lucide-react'
import { incidentesAPI, getErrorMessage } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { useModal } from '../../../hooks/useModal'
import { normFecha, toColombiaISO, fmtFecha } from '../../../utils/dates'
import { usePaginacion } from '../../../hooks/usePaginacion'
import Paginador from '../../../components/Paginador'
import ConfirmDialog from '../../../components/ConfirmDialog'

/* ── Helpers de estado/color ── */
const ESTADOS = ['todos', 'borrador', 'en_revision', 'abierto', 'en_investigacion', 'cerrado']
const ESTADO_LABEL = {
  borrador: 'Borrador', en_revision: 'En revisión',
  abierto: 'Abierto', en_investigacion: 'En investigación', cerrado: 'Cerrado',
}
const ESTADO_COLOR = {
  borrador:         'bg-gray-500/20 text-gray-300',
  en_revision:      'bg-blue-500/20 text-blue-300',
  abierto:          'bg-green-500/20 text-green-300',
  en_investigacion: 'bg-orange-500/20 text-orange-300',
  cerrado:          'bg-red-500/20 text-red-300',
}
const SEVERIDAD_COLOR = {
  leve:     'bg-yellow-500/20 text-yellow-300',
  moderada: 'bg-orange-500/20 text-orange-300',
  grave:    'bg-red-500/20 text-red-300',
}
const TIPO_LABEL = {
  accidente: 'Accidente', incidente: 'Incidente',
  condicion_insegura: 'Condición Insegura',
}
const ROL_LABEL = {
  sst: 'Encargado SST', gerencia: 'Gerencia', empleado: 'Empleado',
}

/* Busca el primer campo no vacío entre varios nombres posibles del backend */
function campoReporte(reporte, candidatos) {
  for (const c of candidatos) {
    if (reporte[c] !== undefined && reporte[c] !== null && reporte[c] !== '') return reporte[c]
  }
  return null
}
const ESTADO_ACCION_LABEL = {
  planificada:  'Planificada',
  en_ejecucion: 'En ejecución',
  completada:   'Completada',
  vencida:      'Vencida',
}
const ESTADO_ACCION_COLOR = {
  planificada:  'bg-blue-500/20 text-blue-300',
  en_ejecucion: 'bg-yellow-500/20 text-yellow-300',
  completada:   'bg-green-500/20 text-green-300',
  vencida:      'bg-red-500/20 text-red-300',
}

/* Convierte fecha ISO a YYYY-MM-DD para input[type=date] */
function isoToDate(isoStr) {
  if (!isoStr) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })
      .format(new Date(normFecha(isoStr)))
  } catch { return '' }
}

function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{text}</span>
}

function BannerError({ msg }) {
  if (!msg) return null
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
      {msg}
    </div>
  )
}

function BannerOk({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
      <CheckCircle size={15} /> {msg}
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: NUEVO REPORTE
══════════════════════════════════════════ */
function ModalNuevoReporte({ darkMode, onClose, onCreado }) {
  const dialogRef = useModal(onClose)
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [form, setForm]           = useState({ tipo: '', severidad: '', fecha: '', lugar: '', descripcion: '' })
  const [errores, setErrores]     = useState({})
  const [bannerErr, setBannerErr] = useState('')
  const [loading, setLoading]     = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e = {}
    if (!form.tipo)        e.tipo        = true
    if (!form.severidad)   e.severidad   = true
    if (!form.fecha)       e.fecha       = true
    if (!form.lugar)       e.lugar       = true
    if (!form.descripcion) e.descripcion = true
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validar()) { setBannerErr('Por favor, diligencia todos los campos obligatorios para continuar.'); return }
    setBannerErr('')
    setLoading(true)
    try {
      await incidentesAPI.create({
        tipo:        form.tipo,
        severidad:   form.severidad,
        fecha:       toColombiaISO(form.fecha),
        lugar:       form.lugar,
        descripcion: form.descripcion,
      })
      onCreado()
      onClose()
    } catch (err) {
      setBannerErr(getErrorMessage(err, 'Error al crear el reporte.'))
    } finally { setLoading(false) }
  }

  const inputClass = (k) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none border ${errores[k] ? 'border-red-500' : 'border-transparent'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-nuevo-reporte-title"
           className="w-full max-w-lg rounded-2xl shadow-2xl"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <h2 id="modal-nuevo-reporte-title" className="font-bold text-lg" style={{ color: text }}>Nuevo Reporte</h2>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <BannerError msg={bannerErr} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Tipo de reporte *</label>
              <select value={form.tipo} onChange={e => { set('tipo', e.target.value); setErrores(prev => ({ ...prev, tipo: false })) }}
                      className={inputClass('tipo')} style={{ backgroundColor: input, color: text }}>
                <option value="">Seleccionar...</option>
                <option value="accidente">Accidente</option>
                <option value="incidente">Incidente</option>
                <option value="cuasi_accidente">Cuasi Accidente</option>
                <option value="condicion_insegura">Condición Insegura</option>
              </select>
              {errores.tipo && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Selecciona el tipo de reporte.</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Severidad *</label>
              <select value={form.severidad} onChange={e => { set('severidad', e.target.value); setErrores(prev => ({ ...prev, severidad: false })) }}
                      className={inputClass('severidad')} style={{ backgroundColor: input, color: text }}>
                <option value="">Seleccionar...</option>
                <option value="sin_lesion">Sin Lesión</option>
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="grave">Grave</option>
                <option value="mortal">Mortal</option>
              </select>
              {errores.severidad && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Selecciona la severidad.</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Fecha y hora *</label>
            <input type="datetime-local" value={form.fecha} onChange={e => { set('fecha', e.target.value); setErrores(prev => ({ ...prev, fecha: false })) }}
                   className={inputClass('fecha')} style={{ backgroundColor: input, color: text }} />
            {errores.fecha && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Ingresa la fecha y hora del evento.</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Lugar *</label>
            <input type="text" placeholder="Área o zona exacta" value={form.lugar}
                   onChange={e => { set('lugar', e.target.value); setErrores(prev => ({ ...prev, lugar: false })) }}
                   className={inputClass('lugar')} style={{ backgroundColor: input, color: text }} />
            {errores.lugar && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Indica el lugar donde ocurrió el evento.</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>Descripción *</label>
            <textarea rows={3} placeholder="Documenta detalladamente el evento..." value={form.descripcion}
                      onChange={e => { set('descripcion', e.target.value); setErrores(prev => ({ ...prev, descripcion: false })) }}
                      className={inputClass('descripcion')} style={{ backgroundColor: input, color: text }} />
            {errores.descripcion && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Describe el evento ocurrido.</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>Cancelar</button>
          <button onClick={guardar} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1' }}>
            {loading ? 'Guardando...' : 'Guardar reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: DETALLE DEL REPORTE
══════════════════════════════════════════ */
const FOCUSABLE_SEL_MD = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function ModalDetalle({ darkMode, reporte, initialTab = 'info', onClose, onActualizado, readOnly = false }) {
  const { user } = useAuth()
  const dialogRef = useRef(null)
  const closeRef  = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const el = dialogRef.current
    el?.querySelectorAll(FOCUSABLE_SEL_MD)?.[0]?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current?.(); return }
      if (e.key !== 'Tab') return
      const els = [...(el?.querySelectorAll(FOCUSABLE_SEL_MD) ?? [])]
      if (!els.length) return
      if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els.at(-1).focus() }
      else if (!e.shiftKey && document.activeElement === els.at(-1)) { e.preventDefault(); els[0].focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [])
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [tab, setTab]             = useState(initialTab)
  const [bannerErr, setBannerErr] = useState('')
  const [bannerOk, setBannerOk]   = useState('')

  /* ── Investigación ── */
  const INV_VACIA = {
    metodo_analisis: '', causas_inmediatas: '', causas_basicas: '',
    factores_contribuyentes: '', descripcion_evento: '', lecciones_aprendidas: '',
  }
  const [investigacion, setInv]     = useState(INV_VACIA)
  const [invOriginal, setInvOriginal] = useState(INV_VACIA)
  const [invExiste, setInvExiste]   = useState(false)
  const [loadingInv, setLoadingInv] = useState(false)
  const [confirmCerrarModal, setConfirmCerrarModal] = useState(false)
  const [confirmEstado, setConfirmEstado] = useState(null)

  /* ── Acciones ── */
  const ACCION_VACIA = { descripcion: '', prioridad: 'media', fecha_limite: '' }
  const [acciones, setAcciones]           = useState([])
  const [accion, setAccion]               = useState(ACCION_VACIA)
  const [loadingAccion, setLoadingAccion] = useState(false)

  /* ── Edición de acción ── */
  const EDICION_VACIA = { descripcion: '', prioridad: 'media', estado: 'planificada', evidencia: '', fecha_limite: '' }
  const [accionEditandoId, setAccionEditandoId] = useState(null)
  const [formEdicion, setFormEdicion]           = useState(EDICION_VACIA)
  const [loadingEdicion, setLoadingEdicion]     = useState(false)

  /* ── FURAT ── */
  const [loadingFurat, setLFurat] = useState(false)

  const setI  = (k, v) => setInv(f => ({ ...f, [k]: v }))
  const setA  = (k, v) => setAccion(f => ({ ...f, [k]: v }))
  const setE  = (k, v) => setFormEdicion(f => ({ ...f, [k]: v }))
  const clearBanners = () => { setBannerErr(''); setBannerOk('') }

  /* ── Carga inicial ── */
  const cargarDetalle = useCallback(async () => {
    if (!readOnly) {
      try {
        const res = await incidentesAPI.getInvestigacion(reporte.id)
        const cargada = {
          metodo_analisis:         res.data.metodo_analisis         || '',
          causas_inmediatas:       res.data.causas_inmediatas       || '',
          causas_basicas:          res.data.causas_basicas          || '',
          factores_contribuyentes: res.data.factores_contribuyentes || '',
          descripcion_evento:      res.data.descripcion_evento      || '',
          lecciones_aprendidas:    res.data.lecciones_aprendidas    || '',
        }
        setInv(cargada)
        setInvOriginal(cargada)
        setInvExiste(true)
      } catch (err) {
        if (err.response?.status !== 404) { /* error ya visible en banner */ }
      }
    }

    try {
      const res = await incidentesAPI.getAcciones(reporte.id)
      setAcciones(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setAcciones([])
    }
  }, [reporte.id, readOnly])

  useEffect(() => { cargarDetalle() }, [cargarDetalle])

  /* ── Abrir formulario de edición precargado ── */
  const abrirEdicion = (a) => {
    setAccionEditandoId(a.id)
    setFormEdicion({
      descripcion:  a.descripcion  || '',
      prioridad:    a.prioridad    || 'media',
      estado:       a.estado       || 'planificada',
      evidencia:    a.evidencia    || '',
      fecha_limite: isoToDate(a.fecha_limite),
    })
    clearBanners()
  }

  const cancelarEdicion = () => {
    setAccionEditandoId(null)
    setFormEdicion(EDICION_VACIA)
  }

  /* ── Guardar edición de acción ── */
  const guardarEdicion = async () => {
    if (!formEdicion.descripcion || !formEdicion.fecha_limite) {
      setBannerErr('Completa la descripción y la fecha límite.')
      setBannerOk('')
      return
    }
    clearBanners()
    setLoadingEdicion(true)
    const snap = { ...formEdicion }
    try {
      const res = await incidentesAPI.actualizarAccion(accionEditandoId, {
        descripcion:  snap.descripcion,
        prioridad:    snap.prioridad,
        estado:       snap.estado,
        evidencia:    snap.evidencia || '',
        fecha_limite: snap.fecha_limite + 'T00:00:00-05:00',
      })
      setAcciones(prev => prev.map(a => a.id === accionEditandoId ? res.data : a))
      cancelarEdicion()
      setBannerOk('Acción actualizada correctamente.')
    } catch (err) {
      setBannerErr(getErrorMessage(err, 'Error al actualizar la acción.'))
    } finally { setLoadingEdicion(false) }
  }
  
  

  /* ── Cambiar estado del reporte ── */
  const ejecutarCambioEstado = async (nuevoEstado) => {
    clearBanners()
    try {
      await incidentesAPI.cambiarEstado(reporte.id, nuevoEstado)
      onActualizado()
    } catch (err) {
      setBannerErr(getErrorMessage(err, 'Error al cambiar estado.'))
    }
  }

  const cambiarEstado = (nuevoEstado) => {
    if (nuevoEstado === 'cerrado' && !invExiste) {
      setBannerErr('No se puede cerrar el reporte si no hay una investigación de causas documentada.')
      setBannerOk('')
      setTab('investigacion')
      return
    }
    if (nuevoEstado === 'cerrado') {
      setConfirmEstado(nuevoEstado)
      return
    }
    ejecutarCambioEstado(nuevoEstado)
  }

  /* ── Detección de cambios sin guardar ── */
  const hayCambiosSinGuardar =
    JSON.stringify(investigacion) !== JSON.stringify(invOriginal) ||
    accion.descripcion !== '' || accion.fecha_limite !== '' ||
    accionEditandoId !== null

  const intentarCerrarModal = () => {
    if (hayCambiosSinGuardar) setConfirmCerrarModal(true)
    else onClose()
  }
  closeRef.current = intentarCerrarModal

  /* ── Guardar / actualizar investigación ── */
  const guardarInvestigacion = async () => {
    if (!investigacion.metodo_analisis || !investigacion.causas_inmediatas || !investigacion.causas_basicas) {
      setBannerErr('Completa los campos obligatorios: método de análisis, causas inmediatas y causas básicas.')
      setBannerOk('')
      return
    }
    clearBanners()
    setLoadingInv(true)
    try {
      if (invExiste) {
        await incidentesAPI.actualizarInvestigacion(reporte.id, investigacion)
      } else {
        await incidentesAPI.crearInvestigacion(reporte.id, investigacion)
        setInvExiste(true)
      }
      setInvOriginal(investigacion)
      setBannerOk('Investigación guardada correctamente.')
    } catch (err) {
      setBannerErr(getErrorMessage(err, 'Error al guardar investigación.'))
    } finally { setLoadingInv(false) }
  }

  /* ── Guardar nueva acción correctiva ── */
  const guardarAccion = async () => {
    if (!accion.descripcion || !accion.fecha_limite) {
      setBannerErr('Completa la descripción y la fecha límite.')
      setBannerOk('')
      return
    }
    const responsableId = user?.id
    if (!responsableId) {
      setBannerErr('No se pudo identificar al usuario. Por favor recarga la página e intenta de nuevo.')
      return
    }
    clearBanners()
    setLoadingAccion(true)
    const snap = { ...accion }
    try {
      const res = await incidentesAPI.crearAccion(reporte.id, {
        descripcion:    snap.descripcion,
        prioridad:      snap.prioridad,
        fecha_limite:   snap.fecha_limite + 'T00:00:00-05:00',
        responsable_id: responsableId,
      })
      setAcciones(prev => [...prev, res.data])
      setAccion(ACCION_VACIA)
      setBannerOk('Acción correctiva registrada.')
    } catch (err) {
      setBannerErr(getErrorMessage(err, 'Error al guardar la acción correctiva.'))
    } finally { setLoadingAccion(false) }
  }

  /* ── Descarga FURAT ── */
  const descargarFurat = async () => {
    setLFurat(true)
    clearBanners()
    try {
      const res = await incidentesAPI.descargarFurat(reporte.id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `FURAT_${reporte.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setBannerErr('Error al descargar el FURAT.')
    } finally { setLFurat(false) }
  }

  const tabs = [
    { id: 'info',          label: 'Información',          labelCorta: 'Info',     Icon: FileText      },
    ...(readOnly ? [] : [
      { id: 'investigacion', label: 'Investigación',        labelCorta: 'Investig.', Icon: Search        },
    ]),
    { id: 'acciones',      label: 'Acciones correctivas', labelCorta: 'Acciones', Icon: ClipboardList },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-detalle-reporte-title"
           className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 id="modal-detalle-reporte-title" className="font-bold text-lg" style={{ color: text }}>
              {TIPO_LABEL[reporte.tipo] || reporte.tipo}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: sub }}>
              {reporte.lugar} · {fmtFecha(reporte.fecha, { dateStyle: 'medium' })}
            </p>
          </div>
          <button onClick={intentarCerrarModal} aria-label="Cerrar"><X size={18} style={{ color: sub }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-2 sm:px-6 overflow-x-auto" style={{ borderColor: border }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); clearBanners(); cancelarEdicion() }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap"
                    style={{
                      borderColor: tab === t.id ? '#6366F1' : 'transparent',
                      color:       tab === t.id ? '#6366F1' : sub,
                    }}>
              <t.Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.labelCorta}</span>
            </button>
          ))}
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <BannerError msg={bannerErr} />
          <BannerOk   msg={bannerOk}  />

          {/* ── TAB INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Lugar</p>
                  <p className="text-sm font-medium" style={{ color: text }}>{reporte.lugar}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Fecha</p>
                  <p className="text-sm font-medium" style={{ color: text }}>{fmtFecha(reporte.fecha)}</p>
                </div>
              </div>

              <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                <p className="text-xs mb-1" style={{ color: sub }}>Descripción</p>
                <p className="text-sm" style={{ color: text }}>{reporte.descripcion}</p>
              </div>

              {(() => {
                const nombre = campoReporte(reporte, ['creado_por_nombre', 'usuario_nombre', 'reportado_por_nombre', 'reportado_por'])
                const rol    = campoReporte(reporte, ['creado_por_rol', 'usuario_rol', 'reportado_por_rol', 'rol_usuario'])
                if (!nombre && !rol) return null
                return (
                  <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                    <p className="text-xs mb-1" style={{ color: sub }}>Reportado por</p>
                    <p className="text-sm font-medium" style={{ color: text }}>
                      {nombre || '—'}
                      {rol && <span className="ml-1.5 font-normal" style={{ color: sub }}>· {ROL_LABEL[rol] || rol}</span>}
                    </p>
                  </div>
                )
              })()}

              {reporte.lesion && (
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs font-medium mb-2" style={{ color: sub }}>Lesión registrada</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm" style={{ color: text }}>
                    <div><span className="text-xs block" style={{ color: sub }}>Tipo</span>{reporte.lesion.tipo_lesion}</div>
                    <div><span className="text-xs block" style={{ color: sub }}>Parte afectada</span>{reporte.lesion.parte_afectada}</div>
                    <div><span className="text-xs block" style={{ color: sub }}>Incapacidad</span>{reporte.lesion.incapacidad_dias} días</div>
                  </div>
                </div>
              )}

              {readOnly ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: input }}>
                  <p className="text-xs mb-1" style={{ color: sub }}>Estado actual</p>
                  <Badge text={ESTADO_LABEL[reporte.estado] || reporte.estado}
                         colorClass={ESTADO_COLOR[reporte.estado] || 'bg-gray-500/20 text-gray-300'} />
                  <p className="text-xs mt-2" style={{ color: sub }}>
                    El encargado de SST gestiona el seguimiento de este reporte.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: sub }}>Cambiar estado</p>
                    <div className="flex flex-wrap gap-2">
                      {['borrador','en_revision','abierto','en_investigacion','cerrado'].map(e => {
                        const deshabilitado = e === 'cerrado' && !invExiste && reporte.estado !== 'cerrado'
                        return (
                          <button key={e} onClick={() => cambiarEstado(e)}
                                  disabled={deshabilitado}
                                  title={deshabilitado ? 'Documenta la investigación de causas antes de cerrar el reporte.' : undefined}
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
                                  style={{
                                    backgroundColor: reporte.estado === e ? '#6366F1' : input,
                                    color:           reporte.estado === e ? '#fff' : text,
                                    border:          `1px solid ${border}`,
                                  }}>
                            {ESTADO_LABEL[e]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button onClick={descargarFurat} disabled={loadingFurat}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium w-full justify-center disabled:opacity-50 transition hover:opacity-80"
                          style={{ border: `1px solid #6366F1`, color: '#6366F1', backgroundColor: 'transparent' }}>
                    <Download size={15} />
                    {loadingFurat ? 'Descargando...' : 'Descargar FURAT (PDF)'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── TAB INVESTIGACIÓN ── */}
          {!readOnly && tab === 'investigacion' && (
            <div className="space-y-4">
              {invExiste && !bannerOk && (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                     style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  <CheckCircle size={13} />
                  Investigación existente cargada. Puedes editarla y guardar los cambios.
                </div>
              )}
              {[
                { k: 'metodo_analisis', label: 'Método de análisis *', type: 'select',
                  options: [['5_por_que','5 Por Qué'],['espina_pescado','Espina de Pescado'],['arbol_causas','Árbol de Causas']] },
                { k: 'descripcion_evento',        label: 'Descripción del evento',  type: 'textarea' },
                { k: 'causas_inmediatas',          label: 'Causas inmediatas *',     type: 'textarea' },
                { k: 'causas_basicas',             label: 'Causas básicas *',        type: 'textarea' },
                { k: 'factores_contribuyentes',    label: 'Factores contribuyentes', type: 'textarea' },
                { k: 'lecciones_aprendidas',       label: 'Lecciones aprendidas',    type: 'textarea' },
              ].map(({ k, label, type, options }) => (
                <div key={k}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: sub }}>{label}</label>
                  {type === 'select'
                    ? (
                      <select value={investigacion[k]} onChange={e => setI(k, e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                              style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }}>
                        <option value="">Seleccionar...</option>
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <textarea rows={2} value={investigacion[k]} onChange={e => setI(k, e.target.value)}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                                style={{ backgroundColor: input, color: text, border: `1px solid ${border}` }} />
                    )
                  }
                </div>
              ))}
              <button onClick={guardarInvestigacion} disabled={loadingInv}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#6366F1' }}>
                {loadingInv ? 'Guardando...' : invExiste ? 'Actualizar investigación' : 'Guardar investigación'}
              </button>
            </div>
          )}

          {/* ── TAB ACCIONES ── */}
          {tab === 'acciones' && (
            <div className="space-y-4">

              {/* Lista de acciones existentes */}
              {acciones.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: sub }}>
                  No hay acciones correctivas registradas.
                </p>
              ) : (
                acciones.map((a) => (
                  <div key={a.id}>
                    {/* ── Tarjeta de acción ── */}
                    {accionEditandoId !== a.id ? (
                      <div className="rounded-lg p-3 text-sm"
                           style={{ backgroundColor: input, color: text }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{a.descripcion}</p>
                            <p className="text-xs mt-1" style={{ color: sub }}>
                              Prioridad: {a.prioridad} · Límite: {fmtFecha(a.fecha_limite, { dateStyle: 'medium' })}
                            </p>
                            {a.evidencia && (
                              <p className="text-xs mt-1" style={{ color: sub }}>
                                Evidencia: {a.evidencia}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {a.estado && (
                              <Badge
                                text={ESTADO_ACCION_LABEL[a.estado] || a.estado}
                                colorClass={ESTADO_ACCION_COLOR[a.estado] || 'bg-gray-500/20 text-gray-300'}
                              />
                            )}
                            {!readOnly && (
                              <button onClick={() => { abrirEdicion(a); clearBanners() }}
                                      className="p-1.5 rounded-lg hover:opacity-70 transition"
                                      style={{ backgroundColor: card, border: `1px solid ${border}` }}
                                      title="Editar acción">
                                <Pencil size={13} style={{ color: sub }} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Formulario de edición inline ── */
                      <div className="rounded-xl p-4 space-y-3"
                           style={{ backgroundColor: input, border: `2px solid #6366F1` }}>
                        <p className="text-sm font-semibold" style={{ color: text }}>Editar acción</p>

                        <textarea rows={2} value={formEdicion.descripcion}
                                  onChange={e => setE('descripcion', e.target.value)}
                                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                                  style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: sub }}>Prioridad</label>
                            <select value={formEdicion.prioridad} onChange={e => setE('prioridad', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                    style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                              <option value="alta">Alta</option>
                              <option value="media">Media</option>
                              <option value="baja">Baja</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: sub }}>Estado</label>
                            <select value={formEdicion.estado} onChange={e => setE('estado', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                    style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                              <option value="planificada">Planificada</option>
                              <option value="en_ejecucion">En ejecución</option>
                              <option value="completada">Completada</option>
                              <option value="vencida">Vencida</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: sub }}>Fecha límite</label>
                            <input type="date" value={formEdicion.fecha_limite}
                                   onChange={e => setE('fecha_limite', e.target.value)}
                                   className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                   style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: sub }}>Evidencia</label>
                            <input type="text" placeholder="Descripción de evidencia"
                                   value={formEdicion.evidencia}
                                   onChange={e => setE('evidencia', e.target.value)}
                                   className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                   style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button onClick={cancelarEdicion}
                                  className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>
                            Cancelar
                          </button>
                          <button onClick={guardarEdicion} disabled={loadingEdicion}
                                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                                  style={{ backgroundColor: '#6366F1' }}>
                            {loadingEdicion ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Formulario nueva acción — se oculta mientras se edita una existente */}
              {!readOnly && !accionEditandoId && (
                <div className="rounded-xl p-4 space-y-3"
                     style={{ backgroundColor: input, border: `1px solid ${border}` }}>
                  <p className="text-sm font-semibold" style={{ color: text }}>Nueva acción correctiva</p>
                  <textarea rows={2} placeholder="Descripción de la acción..." value={accion.descripcion}
                            onChange={e => setA('descripcion', e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                            style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={accion.prioridad} onChange={e => setA('prioridad', e.target.value)}
                            className="rounded-lg px-3 py-2 text-sm outline-none"
                            style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                    <input type="date" value={accion.fecha_limite}
                           onChange={e => setA('fecha_limite', e.target.value)}
                           className="rounded-lg px-3 py-2 text-sm outline-none"
                           style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setAccion(ACCION_VACIA); clearBanners() }}
                            className="px-4 py-2 text-sm rounded-lg" style={{ color: sub }}>
                      Limpiar
                    </button>
                    <button onClick={guardarAccion} disabled={loadingAccion}
                            className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                            style={{ backgroundColor: '#6366F1' }}>
                      {loadingAccion ? 'Guardando...' : 'Guardar acción'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCerrarModal}
        title="¿Descartar cambios?"
        message="Tienes cambios sin guardar en la investigación o en una acción correctiva. Si cierras ahora, se perderán."
        confirmLabel="Descartar y cerrar"
        cancelLabel="Seguir editando"
        danger
        onConfirm={onClose}
        onCancel={() => setConfirmCerrarModal(false)}
      />

      <ConfirmDialog
        open={confirmEstado === 'cerrado'}
        title="¿Marcar reporte como Cerrado?"
        message="Esta acción documenta el cierre formal del caso. Asegúrate de que la investigación y las acciones correctivas estén completas."
        confirmLabel="Sí, cerrar reporte"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => { setConfirmEstado(null); ejecutarCambioEstado('cerrado') }}
        onCancel={() => setConfirmEstado(null)}
      />
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
export default function Incidentes() {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  const esGerencia = user?.role?.toString?.().toLowerCase?.() === 'gerencia'
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'

  const [reportes, setReportes]         = useState([])
  const [filtro, setFiltro]             = useState('todos')
  const [busqueda, setBusqueda]         = useState('')
  const [loading, setLoading]           = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalTab, setModalTab]         = useState('info')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('nuevo') === 'true') {
      setModalNuevo(true)
      setSearchParams({})
    }
  }, [searchParams])

  // Deep link desde notificaciones: /incidentes?reporte={id}&tab=acciones|investigacion
  useEffect(() => {
    const reporteId = searchParams.get('reporte')
    if (reporteId) {
      const tabParam = searchParams.get('tab')
      if (tabParam === 'acciones' || (tabParam === 'investigacion' && !esGerencia)) setModalTab(tabParam)
      else setModalTab('info')
      incidentesAPI.getById(reporteId)
        .then(r => setModalDetalle(r.data))
        .catch(() => {})
        .finally(() => setSearchParams({}))
    }
  }, [searchParams])

  const cargarReportes = () => {
    setLoading(true)
    incidentesAPI.getAll()
      .then(r => setReportes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarReportes() }, [])

  const reportesPropios = esGerencia
    ? reportes.filter(r => {
        const creadorId = campoReporte(r, ['creado_por_id', 'usuario_id', 'reportado_por_id'])
        if (creadorId) return String(creadorId) === String(user?.id)
        // Fallback para reportes antiguos sin creado_por_id: comparamos por nombre
        const creadorNombre = campoReporte(r, ['creado_por_nombre', 'usuario_nombre', 'reportado_por_nombre', 'reportado_por'])
        return creadorNombre && creadorNombre === user?.nombre
      })
    : reportes

  const reportesBuscados = busqueda.trim()
    ? reportesPropios.filter(r => {
        const q = busqueda.trim().toLowerCase()
        return (
          r.descripcion?.toLowerCase().includes(q) ||
          r.lugar?.toLowerCase().includes(q) ||
          (TIPO_LABEL[r.tipo] || r.tipo)?.toLowerCase().includes(q)
        )
      })
    : reportesPropios

  const reportesFiltrados = filtro === 'todos'
    ? reportesBuscados
    : reportesBuscados.filter(r => r.estado === filtro)

  const { paginaItems: reportesPagina, pagina, totalPaginas, setPagina } = usePaginacion(reportesFiltrados)


  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ background: 'transparent' }}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text }}>{esGerencia ? 'Mis reportes' : 'Reportes'}</h1>
          <p className="text-sm mt-0.5" style={{ color: sub }}>
            {esGerencia
              ? `${reportesPropios.length} ${reportesPropios.length === 1 ? 'reporte registrado por ti' : 'reportes registrados por ti'}`
              : `${reportes.length} ${reportes.length === 1 ? 'reporte registrado' : 'reportes registrados'}`}
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#6366F1' }}>
          <Plus size={16} /> Nuevo Reporte
        </button>
      </div>

      {/* Búsqueda de texto */}
      <div className="flex items-center gap-2 mb-3 rounded-lg px-3 py-2"
           style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        <Search size={15} style={{ color: sub }} />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción, lugar o tipo..."
          className="bg-transparent text-sm outline-none flex-1 min-w-0"
          style={{ color: text }}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
            <X size={14} style={{ color: sub }} />
          </button>
        )}
      </div>

      {/* Filtros — pills en desktop, select en móvil */}
      <div className="hidden sm:flex gap-2 flex-wrap mb-6">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setFiltro(e)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    backgroundColor: filtro === e ? '#6366F1' : card,
                    color:           filtro === e ? '#fff' : sub,
                    border:          `1px solid ${filtro === e ? '#6366F1' : border}`,
                  }}>
            {e === 'todos' ? 'Todos' : ESTADO_LABEL[e]}
          </button>
        ))}
      </div>
      <div className="sm:hidden mb-6">
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: card, color: text, border: `1px solid ${border}` }}>
          {ESTADOS.map(e => (
            <option key={e} value={e}>{e === 'todos' ? 'Todos' : ESTADO_LABEL[e]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 flex flex-col gap-3 animate-pulse"
                 style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="h-4 rounded w-2/3" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }} />
                <div className="h-5 rounded-full w-16" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }} />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 rounded w-full" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }} />
                <div className="h-3 rounded w-4/5" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }} />
              </div>
              <div className="h-3 rounded w-1/2 mt-auto" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }} />
            </div>
          ))}
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: sub }} />
          <p className="text-sm" style={{ color: sub }}>
            {busqueda.trim() ? `Sin resultados para "${busqueda.trim()}"` : 'No hay reportes en este estado.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportesPagina.map(r => (
              <div key={r.id} className="rounded-xl p-5 flex flex-col gap-3"
                   style={{
                     backgroundColor: card, border: `1px solid ${border}`,
                     boxShadow: darkMode ? '0 8px 24px -4px rgba(255,255,255,0.08)' : '0 8px 24px -4px rgba(15,23,42,0.14)',
                   }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm" style={{ color: text }}>
                    {TIPO_LABEL[r.tipo] || r.tipo}
                  </p>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <Badge text={ESTADO_LABEL[r.estado] || r.estado}
                           colorClass={ESTADO_COLOR[r.estado] || 'bg-gray-500/20 text-gray-300'} />
                    <Badge text={r.severidad}
                           colorClass={SEVERIDAD_COLOR[r.severidad] || 'bg-gray-500/20 text-gray-300'} />
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: sub }} title={r.descripcion}>
                  {r.descripcion}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: border }}>
                  <div className="text-xs" style={{ color: sub }}>
                    <span>{r.lugar}</span>
                    <span className="mx-1">·</span>
                    <span>{fmtFecha(r.fecha, { dateStyle: 'short' })}</span>
                  </div>
                  <button onClick={() => setModalDetalle(r)}
                          className="text-xs font-semibold rounded-lg px-3 py-1.5 transition hover:opacity-90"
                          style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}>
                    Ver detalle →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} darkMode={darkMode} />
        </>
      )}

      {modalNuevo && (
        <ModalNuevoReporte
          darkMode={darkMode}
          onClose={() => setModalNuevo(false)}
          onCreado={cargarReportes}
        />
      )}
      {modalDetalle && (
        <ModalDetalle
          darkMode={darkMode}
          reporte={modalDetalle}
          initialTab={modalTab}
          onClose={() => setModalDetalle(null)}
          onActualizado={() => { cargarReportes(); setModalDetalle(null) }}
          readOnly={esGerencia}
        />
      )}
    </div>
  )
}