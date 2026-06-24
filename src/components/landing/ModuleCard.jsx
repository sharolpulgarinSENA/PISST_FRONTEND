import { motion } from 'framer-motion'

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function ModuleCard({ icon: Icon, title, tagline, glowColor }) {
  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-8 text-center flex flex-col items-center"
      style={{ background: '#121826', border: '1px solid #1e2a3a' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 50px -10px ${glowColor}`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <span
        className="flex items-center justify-center w-14 h-14 rounded-xl mb-4"
        style={{ background: `${glowColor}` }}
      >
        <Icon size={26} color="#F8FAFC" />
      </span>
      <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
        {tagline}
      </p>
    </motion.div>
  )
}
