import { motion } from 'framer-motion'

export default function AnimatedBar({ label, value, max, delay }) {
  const percentage = (value / max) * 100

  return (
    <div className="flex flex-col items-center gap-2 h-full">
      <div className="flex-1 w-8 flex items-end">
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut', delay }}
          className="w-8 rounded-t-md bg-gradient-to-t from-purple-600 to-blue-500"
          style={{ minHeight: 4 }}
        />
      </div>
      <span
        className="text-[8px] md:text-[10px] text-center md:whitespace-nowrap md:-rotate-45 max-w-[48px] md:max-w-none"
        style={{
          color: '#94A3B8',
          fontFamily: 'Inter, sans-serif',
          overflowWrap: 'break-word',
          transformOrigin: 'top right',
        }}
      >
        {label}
      </span>
    </div>
  )
}
