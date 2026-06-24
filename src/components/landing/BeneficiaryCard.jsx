import { motion } from 'framer-motion'

export default function BeneficiaryCard({ icon: Icon, title, badge, color, featured, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: featured ? -12 : 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className="rounded-2xl p-8 flex-1 flex flex-col items-center text-center"
      style={{
        background: featured
          ? 'linear-gradient(160deg, #1a1438 0%, #121826 60%)'
          : '#121826',
        border: featured ? `1px solid ${color}` : '1px solid #1e2a3a',
        boxShadow: featured ? `0 0 60px -20px ${color}` : 'none',
      }}
    >
      <span
        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
        style={{ background: `${color}1F` }}
      >
        <Icon size={28} color={color} />
      </span>
      <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <span
        className="inline-block text-xs px-3 py-1.5 rounded-full"
        style={{ border: `1px solid ${color}`, color, fontFamily: 'Inter, sans-serif' }}
      >
        {badge}
      </span>
    </motion.div>
  )
}
