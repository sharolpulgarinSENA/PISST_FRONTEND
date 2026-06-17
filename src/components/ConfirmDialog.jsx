import { AlertTriangle } from 'lucide-react'
import PropTypes from 'prop-types'
import { useTheme } from '../context/ThemeContext'
import { useModal } from '../hooks/useModal'

function ConfirmDialogInner({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}) {
  const { darkMode } = useTheme()
  const dialogRef = useModal(onCancel)

  const card     = darkMode ? '#111827' : '#FFFFFF'
  const border   = darkMode ? '#1F2937' : '#E5E7EB'
  const text     = darkMode ? '#F9FAFB' : '#111827'
  const sub      = darkMode ? '#CBD5E1' : '#6B7280'
  const iconBg   = danger ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'
  const iconColor = danger ? '#EF4444' : '#F59E0B'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ backgroundColor: card, border: `1px solid ${border}` }}
      >
        <div className="px-5 py-5 space-y-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>
            <AlertTriangle size={20} style={{ color: iconColor }} />
          </div>
          <h3 id="confirm-dialog-title" className="font-bold text-base" style={{ color: text }}>{title}</h3>
          {message && <p className="text-sm" style={{ color: sub }}>{message}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: border }}>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg transition disabled:opacity-50"
            style={{ color: sub }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-50"
            style={{
              backgroundColor: danger ? '#EF4444' : '#6366F1',
              color: '#FFFFFF',
            }}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal de confirmación genérico para acciones irreversibles o importantes.
 * Uso: <ConfirmDialog open={...} title="..." message="..." onConfirm={...} onCancel={...} />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <ConfirmDialogInner
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      danger={danger}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

ConfirmDialog.propTypes = {
  open:         PropTypes.bool.isRequired,
  title:        PropTypes.string.isRequired,
  message:      PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel:  PropTypes.string,
  danger:       PropTypes.bool,
  loading:      PropTypes.bool,
  onConfirm:    PropTypes.func.isRequired,
  onCancel:     PropTypes.func.isRequired,
}
