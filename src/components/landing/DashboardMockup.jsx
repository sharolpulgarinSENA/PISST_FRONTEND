import { motion } from 'framer-motion'
import { useTiltEffect } from '../../hooks/useTiltEffect'

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768

export default function DashboardMockup({ src, alt, glowColor = 'rgba(37,99,255,0.2)' }) {
  const { tilt, handleMouseMove, handleMouseLeave } = useTiltEffect()
  const mobile = isMobileViewport()

  return (
    <div className="relative" style={{ perspective: 1200 }}>
      <div className="absolute -inset-10 blur-3xl -z-10" style={{ background: glowColor }} />

      <motion.div
        onMouseMove={mobile ? undefined : handleMouseMove}
        onMouseLeave={mobile ? undefined : handleMouseLeave}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        animate={mobile ? undefined : { rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="rounded-2xl overflow-hidden border border-white/10"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          style={{ boxShadow: `0 0 80px ${glowColor}` }}
        />
      </motion.div>
    </div>
  )
}
