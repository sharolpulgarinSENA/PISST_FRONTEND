import { AlertTriangle, ShieldAlert, GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function muted(darkMode) {
  return darkMode ? '#9CA3AF' : '#6B7280'
}

function Panel({ darkMode, title, Icon, iconBg, iconColor, children }) {
  return (
    <article
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h4
          className="text-sm font-semibold"
          style={{ color: darkMode ? '#F9FAFB' : '#111827' }}
        >
          {title}
        </h4>
      </div>
      <div className="space-y-3">{children}</div>
    </article>
  )
}

function Stat({ darkMode, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: muted(darkMode) }}>{label}</span>
      <span className="font-semibold" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
        {value}
      </span>
    </div>
  )
}

function SectionLabel({ darkMode, children }) {
  return (
    <p className="text-xs font-medium pt-1" style={{ color: muted(darkMode) }}>
      {children}
    </p>
  )
}

function BreakdownBars({ darkMode, data, barColor }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((acc, [, v]) => acc + v, 0)

  if (entries.length === 0) {
    return <p className="text-xs" style={{ color: muted(darkMode) }}>Sin datos registrados</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="capitalize" style={{ color: darkMode ? '#D1D5DB' : '#374151' }}>
              {key.replace(/_/g, ' ')}
            </span>
            <span style={{ color: muted(darkMode) }}>{value}</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full`}
              style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const TENDENCIA_META = {
  alza: { label: 'En alza', Icon: TrendingUp, color: 'text-rose-500 dark:text-rose-400' },
  baja: { label: 'En baja', Icon: TrendingDown, color: 'text-emerald-500 dark:text-emerald-400' },
  estable: { label: 'Estable', Icon: Minus, color: 'text-sky-500 dark:text-sky-400' },
}

export default function AnalyticsSummary({ darkMode, incidentes, riesgos, capacitaciones }) {
  const tendencia = TENDENCIA_META[incidentes?.tendencia] ?? TENDENCIA_META.estable
  const TendenciaIcon = tendencia.Icon

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <Panel
        darkMode={darkMode}
        title="Reportes por tipo y severidad"
        Icon={AlertTriangle}
        iconBg="bg-indigo-100 dark:bg-indigo-500/10"
        iconColor="text-indigo-600 dark:text-indigo-400"
      >
        <div className="flex items-center justify-between text-sm mb-1">
          <span style={{ color: muted(darkMode) }}>Tendencia mensual</span>
          <span className={`flex items-center gap-1 font-medium ${tendencia.color}`}>
            <TendenciaIcon className="w-4 h-4" />
            {tendencia.label}
          </span>
        </div>
        <Stat darkMode={darkMode} label="Promedio mensual" value={incidentes?.tasa_mensual_promedio ?? 0} />
        <SectionLabel darkMode={darkMode}>Por tipo</SectionLabel>
        <BreakdownBars darkMode={darkMode} data={incidentes?.por_tipo} barColor="bg-indigo-500 dark:bg-indigo-400" />
        <SectionLabel darkMode={darkMode}>Por severidad</SectionLabel>
        <BreakdownBars darkMode={darkMode} data={incidentes?.por_severidad} barColor="bg-rose-500 dark:bg-rose-400" />
      </Panel>

      <Panel
        darkMode={darkMode}
        title="Riesgos y peligros"
        Icon={ShieldAlert}
        iconBg="bg-amber-100 dark:bg-amber-500/10"
        iconColor="text-amber-600 dark:text-amber-400"
      >
        <Stat darkMode={darkMode} label="Total de peligros" value={riesgos?.total_peligros ?? 0} />
        <Stat darkMode={darkMode} label="Críticos sin control" value={riesgos?.criticos_sin_control ?? 0} />
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: muted(darkMode) }}>Con control implementado</span>
            <span style={{ color: muted(darkMode) }}>{riesgos?.pct_con_control_implementado ?? 0}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
              style={{ width: `${riesgos?.pct_con_control_implementado ?? 0}%` }}
            />
          </div>
        </div>
        <SectionLabel darkMode={darkMode}>Por nivel de riesgo</SectionLabel>
        <BreakdownBars darkMode={darkMode} data={riesgos?.por_nivel} barColor="bg-amber-500 dark:bg-amber-400" />
      </Panel>

      <Panel
        darkMode={darkMode}
        title="Capacitaciones y formación"
        Icon={GraduationCap}
        iconBg="bg-emerald-100 dark:bg-emerald-500/10"
        iconColor="text-emerald-600 dark:text-emerald-400"
      >
        <Stat darkMode={darkMode} label="Tasa de aprobación" value={`${capacitaciones?.tasa_aprobacion_pct ?? 0}%`} />
        <Stat darkMode={darkMode} label="Asistencia promedio" value={`${capacitaciones?.asistencia_promedio_pct ?? 0}%`} />
        <Stat darkMode={darkMode} label="Sin sesión realizada" value={capacitaciones?.capacitaciones_sin_sesion_realizada ?? 0} />
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: muted(darkMode) }}>
            Empleados con asistencia &lt; 80% ({capacitaciones?.alertas_asistencia?.length ?? 0})
          </p>
          {capacitaciones?.alertas_asistencia?.length ? (
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {capacitaciones.alertas_asistencia.map((a) => (
                <div key={a.empleado_id} className="flex items-center justify-between text-xs">
                  <span className="truncate font-mono" style={{ color: darkMode ? '#D1D5DB' : '#374151' }}>
                    {a.empleado_id.slice(0, 8)}…
                  </span>
                  <span className="text-rose-500 dark:text-rose-400 font-medium">{a.asistencia_pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: muted(darkMode) }}>Sin alertas de asistencia</p>
          )}
        </div>
      </Panel>
    </section>
  )
}
