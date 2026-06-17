import { ChevronLeft, ChevronRight } from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * Controles de paginación (flecha izquierda, indicador "Página X de Y", flecha derecha).
 * No se renderiza si solo hay una página.
 */
export default function Paginador({ pagina, totalPaginas, onCambiar, darkMode }) {
  if (totalPaginas <= 1) return null

  const card   = darkMode ? '#111827' : '#FFFFFF'
  const border = darkMode ? '#1F2937' : '#E5E7EB'
  const text   = darkMode ? '#F9FAFB' : '#111827'
  const sub    = darkMode ? '#CBD5E1' : '#6B7280'

  const botonEstilo = (deshabilitado) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 9,
    border: `1px solid ${border}`, backgroundColor: card,
    color: deshabilitado ? sub : text,
    opacity: deshabilitado ? 0.5 : 1,
    cursor: deshabilitado ? 'not-allowed' : 'pointer',
  })

  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <button
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        style={botonEstilo(pagina <= 1)}
      >
        <ChevronLeft size={16} />
      </button>

      <span
        className="text-xs font-medium px-3 py-1.5 rounded-full"
        style={{ backgroundColor: darkMode ? '#1F2937' : '#F3F4F6', color: text }}
      >
        Página {pagina} de {totalPaginas}
      </span>

      <button
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
        aria-label="Página siguiente"
        style={botonEstilo(pagina >= totalPaginas)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

Paginador.propTypes = {
  pagina:       PropTypes.number.isRequired,
  totalPaginas: PropTypes.number.isRequired,
  onCambiar:    PropTypes.func.isRequired,
  darkMode:     PropTypes.bool,
}
