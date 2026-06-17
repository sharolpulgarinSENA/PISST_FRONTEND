import { useState, useEffect, useMemo } from 'react'

/**
 * Tamaño de página responsivo según el ancho de pantalla.
 * Por defecto: 4 en móvil, 6 en tablet, 9 en escritorio.
 */
export function useTamanoPagina({ movil = 4, tablet = 6, escritorio = 9 } = {}) {
  const [tamano, setTamano] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
      ? movil
      : typeof window !== 'undefined' && window.innerWidth < 1024
        ? tablet
        : escritorio
  )

  useEffect(() => {
    const calcular = () => {
      const w = window.innerWidth
      if (w < 640) setTamano(movil)
      else if (w < 1024) setTamano(tablet)
      else setTamano(escritorio)
    }
    calcular()
    window.addEventListener('resize', calcular)
    return () => window.removeEventListener('resize', calcular)
  }, [movil, tablet, escritorio])

  return tamano
}

/**
 * Pagina un arreglo de items con tamaño de página responsivo.
 * La página vuelve a 1 cuando cambia el tamaño de página o la
 * cantidad total de items (p.ej. al cambiar de filtro).
 */
export function usePaginacion(items, opcionesTamano) {
  const tamano = useTamanoPagina(opcionesTamano)
  const [pagina, setPagina] = useState(1)
  const total = items.length

  const totalPaginas = Math.max(1, Math.ceil(total / tamano))

  // Si cambia el total de items o el tamaño de página (p.ej. al cambiar de
  // filtro o de breakpoint), se vuelve a la página 1 durante el render.
  const claveActual = `${total}-${tamano}`
  const [claveAnterior, setClaveAnterior] = useState(claveActual)
  let paginaActual = pagina
  if (claveAnterior !== claveActual) {
    setClaveAnterior(claveActual)
    setPagina(1)
    paginaActual = 1
  }
  paginaActual = Math.min(paginaActual, totalPaginas)

  const paginaItems = useMemo(() => {
    const inicio = (paginaActual - 1) * tamano
    return items.slice(inicio, inicio + tamano)
  }, [items, paginaActual, tamano])

  return { paginaItems, pagina: paginaActual, totalPaginas, setPagina, tamano }
}
