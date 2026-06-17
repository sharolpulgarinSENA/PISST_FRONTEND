import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = ['#6366F1', '#10B981', '#F97316', '#F43F5E', '#0EA5E9', '#F59E0B']

export default function OverviewChart({ darkMode, data }) {
  const muted = darkMode ? '#CBD5E1' : '#6B7280'
  const isEmpty = !data || data.length === 0 || data.every(d => !d.valor)

  return (
    <section
      className="rounded-2xl p-5 sm:p-6 mb-6 border"
      style={{
        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB',
      }}
    >
      <div className="mb-5">
        <h3
          className="text-base font-semibold"
          style={{ color: darkMode ? '#F9FAFB' : '#111827' }}
        >
          Comparativa General SST
        </h3>
        <p className="text-xs mt-1" style={{ color: muted }}>
          Cifras actuales registradas en el sistema
        </p>
      </div>

      {isEmpty ? (
        <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center gap-2"
             style={{ color: muted }}>
          <BarChart className="w-10 h-10 opacity-30" />
          <p className="text-sm">No hay datos para mostrar en este periodo.</p>
        </div>
      ) : (
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#1F2937' : '#E5E7EB'}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                background: darkMode ? '#0B0F19' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: darkMode ? '#F9FAFB' : '#111827',
              }}
              labelStyle={{ color: muted }}
            />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  )
}
