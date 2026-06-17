import { Loader } from 'lucide-react'

export default function Spinner({ size = 28, color = '#6366F1', padding = 48 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding }}>
      <Loader size={size} color={color} className="motion-safe:animate-spin" />
    </div>
  )
}
