import { useEffect, useRef } from 'react'

const FOCUSABLE_SEL =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Gestiona focus-in, focus trap y cierre con Escape para modales.
 * @param {() => void} onClose - Función que cierra el modal (siempre fresca via ref).
 * @returns {React.RefObject} - Ref para asignar al contenedor del diálogo.
 */
export function useModal(onClose) {
  const dialogRef = useRef(null)
  const cbRef = useRef(onClose)
  cbRef.current = onClose

  useEffect(() => {
    const prev = document.activeElement
    const el = dialogRef.current
    const first = el?.querySelectorAll(FOCUSABLE_SEL)?.[0]
    first?.focus()

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        cbRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const els = [...(el?.querySelectorAll(FOCUSABLE_SEL) ?? [])]
      if (!els.length) return
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault()
        els.at(-1).focus()
      } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
        e.preventDefault()
        els[0].focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      prev?.focus?.()
    }
  }, [])

  return dialogRef
}
