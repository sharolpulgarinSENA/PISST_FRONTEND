import { MessageCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Chat() {
  const { darkMode } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ backgroundColor: darkMode ? '#1F2937' : '#EEF2FF' }}
      >
        <MessageCircle size={26} style={{ color: '#6366F1' }} />
      </div>
      <h2 className="text-lg font-semibold" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
        Chat SASBOT — próximamente disponible
      </h2>
      <p className="text-sm max-w-md" style={{ color: darkMode ? '#CBD5E1' : '#6B7280' }}>
        Estamos preparando este espacio para que puedas conversar con SASBOT. Vuelve a revisar más adelante.
      </p>
    </div>
  )
}
