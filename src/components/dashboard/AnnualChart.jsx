import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Calendar, ChevronDown, MoreHorizontal } from 'lucide-react'

export default function AnnualChart({ darkMode, data }) {
  return (
    <section
      className="rounded-2xl p-5 sm:p-6 mb-6 border"
      style={{
        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB',
      }}
    >
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3
          className="text-base font-semibold"
          style={{ color: darkMode ? '#F9FAFB' : '#111827' }}
        >
          Resumen de Accidentes, Trabajadores y Días Perdidos
        </h3>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition hover:opacity-80"
            style={{
              borderColor: darkMode ? '#1F2937' : '#E5E7EB',
              color: darkMode ? '#E5E7EB' : '#374151',
              backgroundColor: darkMode ? '#0B0F19' : '#FFFFFF',
            }}
          >
            <Calendar className="w-4 h-4" />
            Este año
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            className="p-2 rounded-lg border transition hover:opacity-80"
            style={{
              borderColor: darkMode ? '#1F2937' : '#E5E7EB',
              color: darkMode ? '#E5E7EB' : '#374151',
              backgroundColor: darkMode ? '#0B0F19' : '#FFFFFF',
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============ GRÁFICA ============ */}
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 30, right: 10, left: -10, bottom: 5 }}
            >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#1F2937' : '#E5E7EB'}
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: darkMode ? '#0B0F19' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#1F2937' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: darkMode ? '#F9FAFB' : '#111827',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend
            verticalAlign="top"
            align="left"
            iconType="circle"
            wrapperStyle={{ fontSize: '13px', paddingBottom: '20px' }}
            />
            <Line
              type="monotone"
              dataKey="accidentes"
              name="Accidentes"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366F1' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="trabajadores"
              name="Trabajadores"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#10B981' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="dias"
              name="Días perdidos"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#F97316' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}