import { useState, useCallback } from 'react'

export function useTiltEffect() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -10, y: px * 10 })
  }, [])

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  return { tilt, handleMouseMove, handleMouseLeave }
}
