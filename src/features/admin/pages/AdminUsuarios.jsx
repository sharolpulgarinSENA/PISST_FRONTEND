import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { KeyRound, Trash2, CheckCircle2 } from 'lucide-react'
import { adminAPI, getErrorMessage } from '../../../services/api'
import ConfirmDialog from '../../../components/ConfirmDialog'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function AdminUsuarios() {
  const { darkMode } = useTheme()
  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'
  const input  = darkMode ? '#1F2937' : '#F3F4F6'

  const [usuarioId, setUsuarioId]     = useState('')
  const [errorReset, setErrorReset]   = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [okReset, setOkReset]         = useState('')

  const [confirmLimpiar, setConfirmLimpiar] = useState(false)
  const [loadingLimpiar, setLoadingLimpiar] = useState(false)
  const [errorLimpiar, setErrorLimpiar]     = useState('')
  const [okLimpiar, setOkLimpiar]           = useState('')

  const abrirConfirmReset = () => {
    setErrorReset('')
    if (!usuarioId.trim()) { setErrorReset('Ingresa el ID del usuario.'); return }
    if (!UUID_RE.test(usuarioId.trim())) { setErrorReset('El ID debe ser un UUID válido.'); return }
    setConfirmReset(true)
  }

  const ejecutarReset = async () => {
    setLoadingReset(true)
    setErrorReset('')
    try {
      await adminAPI.resetPassword(usuarioId.trim())
      setOkReset('Enlace de reset enviado correctamente.')
      setUsuarioId('')
      setTimeout(() => setOkReset(''), 5000)
      setConfirmReset(false)
    } catch (err) {
      setErrorReset(getErrorMessage(err, 'No se pudo enviar el enlace de reset.'))
      setConfirmReset(false)
    } finally {
      setLoadingReset(false)
    }
  }

  const ejecutarLimpiar = async () => {
    setLoadingLimpiar(true)
    setErrorLimpiar('')
    try {
      const { data } = await adminAPI.limpiarTokens()
      setOkLimpiar(data?.mensaje || data?.message || 'Tokens caducados eliminados correctamente.')
      setTimeout(() => setOkLimpiar(''), 5000)
      setConfirmLimpiar(false)
    } catch (err) {
      setErrorLimpiar(getErrorMessage(err, 'No se pudo completar la limpieza de tokens.'))
      setConfirmLimpiar(false)
    } finally {
      setLoadingLimpiar(false)
    }
  }

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6" style={{ background: 'transparent' }}>
      <div className="mb-6">
        <h1 className="font-bold text-xl" style={{ color: text }}>Usuarios</h1>
        <p className="text-sm mt-0.5" style={{ color: sub }}>Acciones administrativas sobre cuentas de usuario.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Resetear contraseña ── */}
        <div className="rounded-xl p-5" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <KeyRound size={18} style={{ color: '#818CF8' }} />
            </div>
            <h2 className="font-semibold text-base" style={{ color: text }}>Resetear contraseña</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: sub }}>
            Envía un enlace de restablecimiento de contraseña a un usuario específico.
          </p>

          {okReset && (
            <div className="text-sm rounded-lg px-4 py-3 mb-3 flex items-center gap-2"
                 style={{ backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${darkMode ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, color: darkMode ? '#86EFAC' : '#15803D' }}>
              <CheckCircle2 size={16} className="shrink-0" /> {okReset}
            </div>
          )}
          {errorReset && (
            <div className="text-sm rounded-lg px-4 py-3 mb-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {errorReset}
            </div>
          )}

          <label htmlFor="usuario-id" className="text-xs font-medium mb-1 block" style={{ color: sub }}>
            ID del usuario (UUID)
          </label>
          <input
            id="usuario-id"
            type="text"
            placeholder="00000000-0000-0000-0000-000000000000"
            value={usuarioId}
            onChange={(e) => { setUsuarioId(e.target.value); setErrorReset('') }}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border border-transparent mb-1"
            style={{ backgroundColor: input, color: text }}
          />
          <p className="text-xs mb-4" style={{ color: sub }}>
            Copia el ID del usuario desde la base de datos o el panel correspondiente.
          </p>

          <button
            onClick={abrirConfirmReset}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#6366F1' }}
          >
            Enviar reset
          </button>
        </div>

        {/* ── Mantenimiento del sistema ── */}
        <div className="rounded-xl p-5" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <Trash2 size={18} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="font-semibold text-base" style={{ color: text }}>Mantenimiento del sistema</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: sub }}>
            Elimina del sistema los tokens de sesión y de restablecimiento que ya caducaron.
          </p>

          {okLimpiar && (
            <div className="text-sm rounded-lg px-4 py-3 mb-3 flex items-center gap-2"
                 style={{ backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${darkMode ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, color: darkMode ? '#86EFAC' : '#15803D' }}>
              <CheckCircle2 size={16} className="shrink-0" /> {okLimpiar}
            </div>
          )}
          {errorLimpiar && (
            <div className="text-sm rounded-lg px-4 py-3 mb-3"
                 style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, color: darkMode ? '#FCA5A5' : '#B91C1C' }}>
              {errorLimpiar}
            </div>
          )}

          <button
            onClick={() => setConfirmLimpiar(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#EF4444' }}
          >
            Limpiar tokens caducados
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Enviar reset de contraseña"
        message="Se enviará un enlace de restablecimiento de contraseña al usuario indicado. ¿Deseas continuar?"
        confirmLabel="Enviar reset"
        danger={false}
        loading={loadingReset}
        onConfirm={ejecutarReset}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmDialog
        open={confirmLimpiar}
        title="Limpiar tokens caducados"
        message="Esta acción eliminará permanentemente los tokens caducados del sistema. ¿Deseas continuar?"
        confirmLabel="Limpiar tokens"
        danger
        loading={loadingLimpiar}
        onConfirm={ejecutarLimpiar}
        onCancel={() => setConfirmLimpiar(false)}
      />
    </div>
  )
}
