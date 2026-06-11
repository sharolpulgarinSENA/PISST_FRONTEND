import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function KPICard({
  darkMode,
  label,
  value,
  delta,
  deltaPositive,
  Icon,
  iconBg,
  iconColor,
  trendColor,
  trend,
}) {
  // Convertimos el array de números en formato que entiende recharts
  const data = trend.map((v, i) => ({ x: i, y: v }))
  const muted = darkMode ? '#9CA3AF' : '#6B7280'

  return (
    <article
      className="rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB',
      }}
    >
      {/* ====== Header: icono + label ====== */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span
          className="text-xs text-right leading-tight max-w-[60%]"
          style={{ color: muted }}
        >
          {label}
        </span>
      </div>

      {/* ====== Valor principal ====== */}
      <div
        className="text-3xl font-bold mb-1"
        style={{ color: darkMode ? '#F9FAFB' : '#111827' }}
      >
        {value}
      </div>

      {/* ====== Footer: delta + sparkline ====== */}
      <div className="flex items-end justify-between gap-2">
        <span
          className="text-xs font-medium"
          style={{ color: deltaPositive ? (darkMode ? '#34D399' : '#059669') : (darkMode ? '#F87171' : '#DC2626') }}
        >
          {delta}
        </span>

        <div className="w-20 h-8 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="y"
                stroke={trendColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  )
}