import { useTheme } from '../context/ThemeContext'
import logoClaro from '../assets/imagenes/pisst_logo.png'
import logoOscuro from '../assets/imagenes/logopisstCLaro-removebg-preview.png'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function Mantenimiento() {
  const { darkMode } = useTheme()
  const [recargando, setRecargando] = useState(false)
  const logo = darkMode ? logoClaro : logoOscuro

  const bg      = darkMode ? '#0B0F19' : '#F1F5F9'
  const card    = darkMode ? '#111827' : '#FFFFFF'
  const border  = darkMode ? '#1F2937' : '#E5E7EB'
  const text    = darkMode ? '#F9FAFB' : '#111827'
  const sub     = darkMode ? '#CBD5E1' : '#6B7280'

  const reintentar = () => {
    setRecargando(true)
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: bg, padding: '2rem',
    }}>
      <div style={{
        backgroundColor: card, border: `1px solid ${border}`,
        borderRadius: 16, padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
        textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <img src={logo} alt="PISST" style={{ height: 56, margin: '0 auto 1.5rem', display: 'block' }} />

        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
          backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: text, margin: '0 0 0.5rem' }}>
          Sistema en mantenimiento
        </h2>
        <p style={{ fontSize: 14, color: sub, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          Estamos realizando mejoras para brindarte una mejor experiencia.
          Vuelve en unos minutos.
        </p>

        <button
          onClick={reintentar}
          disabled={recargando}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.6rem 1.5rem', borderRadius: 9, cursor: recargando ? 'not-allowed' : 'pointer',
            border: `1px solid ${border}`, backgroundColor: recargando ? border : '#6366F1',
            color: recargando ? sub : '#fff', fontSize: 14, fontWeight: 600,
            opacity: recargando ? 0.7 : 1, transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={15} className={recargando ? 'motion-safe:animate-spin' : ''} />
          {recargando ? 'Verificando…' : 'Reintentar'}
        </button>
      </div>
    </div>
  )
}
