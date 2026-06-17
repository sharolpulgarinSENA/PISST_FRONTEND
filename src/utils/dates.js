export function normFecha(f) {
  if (!f) return ''
  return f.endsWith('Z') || f.includes('+') || /[+-]\d{2}:\d{2}$/.test(f)
    ? f
    : f + 'Z'
}

export function formatColombia(fechaStr, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!fechaStr) return ''
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    ...opts,
  }).format(new Date(normFecha(fechaStr)))
}

export function fmtFecha(f, opts = { dateStyle: 'medium' }) {
  if (!f) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    ...opts,
  }).format(new Date(normFecha(f)))
}

export function toColombiaISO(localStr) {
  if (!localStr) return null
  return localStr.length === 16 ? localStr + ':00-05:00' : localStr + '-05:00'
}

export function backendToInputLocal(raw) {
  if (!raw) return ''
  const d = new Date(normFecha(raw))
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const col = new Date(d.toLocaleString('en-CA', { timeZone: 'America/Bogota' }))
  return `${col.getFullYear()}-${pad(col.getMonth() + 1)}-${pad(col.getDate())}T${pad(col.getHours())}:${pad(col.getMinutes())}`
}

export function tiempoRelativo(fechaStr) {
  const fecha = new Date(normFecha(fechaStr))
  const diffMs = new Date() - fecha
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  return `hace ${Math.floor(diffH / 24)}d`
}
