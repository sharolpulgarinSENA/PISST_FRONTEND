import { LineChart, Line, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

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
  urgent = false,
  urgentColor = '#EF4444',
}) {
  const data = Array.isArray(trend) ? trend.map((v, i) => ({ x: i, y: v })) : []
  const muted = darkMode ? '#CBD5E1' : '#6B7280'

  return (
    <article
      className="rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
        borderColor: urgent ? urgentColor : (darkMode ? '#1F2937' : '#E5E7EB'),
        borderTopWidth: urgent ? '3px' : '1px',
      }}
    >
      {/* ====== Header: icono + label ====== */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span
          className="text-xs text-right leading-tight max-w-[60%] line-clamp-2"
          title={label}
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

        {data.length > 0 && (
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
        )}
      </div>
    </article>
  )
}

KPICard.propTypes = {
  darkMode:      PropTypes.bool,
  label:         PropTypes.string.isRequired,
  value:         PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta:         PropTypes.string,
  deltaPositive: PropTypes.bool,
  Icon:          PropTypes.elementType.isRequired,
  iconBg:        PropTypes.string,
  iconColor:     PropTypes.string,
  trendColor:    PropTypes.string,
  trend:         PropTypes.arrayOf(PropTypes.number),
  urgent:        PropTypes.bool,
  urgentColor:   PropTypes.string,
}