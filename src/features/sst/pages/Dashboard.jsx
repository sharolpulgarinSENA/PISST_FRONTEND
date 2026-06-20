import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Users, Shield,
  ShieldCheck, FileText, GraduationCap, Clock,
  TrendingUp, AlertCircle, CheckCircle2, FileSearch, RefreshCw,
} from 'lucide-react'

import KPICard from '../../../components/dashboard/KPICard'
import MetricsAccordion from '../../../components/dashboard/MetricsAccordion'
import OverviewChart from '../../../components/dashboard/OverviewChart'
import AnalyticsSummary from '../../../components/dashboard/AnalyticsSummary'
import ReportDocumentation from '../../../components/dashboard/ReportDocumentation'
import { metricasAPI, analyticsAPI } from '../../../services/api'
import { useTheme } from '../../../context/ThemeContext'

const PERIODOS = [
  { value: 'mes',       label: 'Mes actual' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'anio',      label: 'Año' },
]

function Skeleton({ darkMode, className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }}
    />
  )
}

export default function Dashboard() {
  const { darkMode } = useTheme()
  const [dashboard, setDashboard] = useState(null)
  const [analyticsIncidentes, setAnalyticsIncidentes] = useState(null)
  const [analyticsRiesgos, setAnalyticsRiesgos] = useState(null)
  const [analyticsCapacitaciones, setAnalyticsCapacitaciones] = useState(null)
  const [analyticsCumplimiento, setAnalyticsCumplimiento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [periodo, setPeriodo] = useState('mes')
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargarDatos = useCallback((periodoActual) => {
    setLoading(true)
    setError(false)
    Promise.all([
      metricasAPI.getDashboard(periodoActual),
      analyticsAPI.getIncidentes(periodoActual),
      analyticsAPI.getRiesgos(periodoActual),
      analyticsAPI.getCapacitaciones(periodoActual),
      analyticsAPI.getCumplimiento(periodoActual),
    ])
      .then(([dashRes, incRes, riesgosRes, capRes, cumpRes]) => {
        setDashboard(dashRes.data)
        setAnalyticsIncidentes(incRes.data)
        setAnalyticsRiesgos(riesgosRes.data)
        setAnalyticsCapacitaciones(capRes.data)
        setAnalyticsCumplimiento(cumpRes.data)
        setUltimaActualizacion(new Date())
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargarDatos(periodo)
  }, [cargarDatos, periodo])

  const sub  = darkMode ? '#CBD5E1' : '#6B7280'
  const text = darkMode ? '#F9FAFB' : '#111827'

  const selectorPeriodo = (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
            style={{
              backgroundColor: periodo === p.value ? '#6366F1' : (darkMode ? '#1F2937' : '#E5E7EB'),
              color: periodo === p.value ? '#FFFFFF' : sub,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {ultimaActualizacion && (
        <span className="text-xs" style={{ color: sub }}>
          Actualizado {new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', timeStyle: 'short' }).format(ultimaActualizacion)}
        </span>
      )}
    </div>
  )

  if (error) return (
    <main
      className="flex-1 flex items-center justify-center px-4"
      style={{ background: 'transparent' }}
    >
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
          <AlertTriangle size={22} style={{ color: '#EF4444' }} />
        </div>
        <h2 className="font-semibold mb-1" style={{ color: text }}>No se pudieron cargar los datos del dashboard</h2>
        <p className="text-sm mb-4" style={{ color: sub }}>
          Ocurrió un error al conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.
        </p>
        <button
          onClick={() => cargarDatos(periodo)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
          style={{ backgroundColor: '#6366F1' }}
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    </main>
  )

  if (loading) return (
    <main
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
      style={{ background: 'transparent' }}
    >
      {selectorPeriodo}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} darkMode={darkMode} className="h-28" />
        ))}
      </section>

      {/* Accordions */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Skeleton darkMode={darkMode} className="h-64 xl:col-span-2" />
        <Skeleton darkMode={darkMode} className="h-64 xl:col-span-1" />
      </section>

      {/* Analytics summary */}
      <Skeleton darkMode={darkMode} className="h-40 mb-6" />

      {/* Overview chart */}
      <Skeleton darkMode={darkMode} className="h-80 mb-6" />

      {/* Report documentation */}
      <Skeleton darkMode={darkMode} className="h-48" />
    </main>
  )

  const kpis = dashboard?.kpis

  const kpiCards = [
    {
      id: 'incidentes',
      label: 'Reportes activos',
      value: dashboard?.incidentes_activos ?? 0,
      delta: `${analyticsIncidentes?.total_incidentes ?? 0} totales registrados`,
      deltaPositive: (dashboard?.incidentes_activos ?? 0) === 0,
      Icon: AlertTriangle,
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      urgent: (dashboard?.incidentes_activos ?? 0) > 0,
      urgentColor: '#6366F1',
    },
    {
      id: 'empleados',
      label: 'Empleados activos',
      value: kpis?.total_trabajadores ?? 0,
      delta: 'Total registrados',
      deltaPositive: true,
      Icon: Users,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'capacitaciones',
      label: 'Capacitaciones',
      value: dashboard?.total_capacitaciones ?? 0,
      delta: 'Total registradas',
      deltaPositive: true,
      Icon: GraduationCap,
      iconBg: 'bg-orange-100 dark:bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'acciones',
      label: 'Acciones vencidas',
      value: dashboard?.acciones_vencidas ?? 0,
      delta: 'Requieren atención',
      deltaPositive: dashboard?.acciones_vencidas === 0,
      Icon: Shield,
      iconBg: 'bg-rose-100 dark:bg-rose-500/10',
      iconColor: 'text-rose-600 dark:text-rose-400',
      urgent: (dashboard?.acciones_vencidas ?? 0) > 0,
      urgentColor: '#EF4444',
    },
  ]

  const overviewData = [
    { name: 'Reportes activos', valor: dashboard?.incidentes_activos ?? 0 },
    { name: 'Acciones vencidas', valor: dashboard?.acciones_vencidas ?? 0 },
    { name: 'Capacitaciones', valor: dashboard?.total_capacitaciones ?? 0 },
    { name: 'Peligros identificados', valor: analyticsRiesgos?.total_peligros ?? 0 },
    { name: 'Accidentes totales', valor: kpis?.total_accidentes ?? 0 },
    { name: 'Días perdidos', valor: kpis?.dias_perdidos ?? 0 },
  ]

  const desglose = analyticsCumplimiento?.desglose

  const complianceMetrics = [
    {
      id: 'incidentes_investigados',
      label: 'Reportes investigados',
      value: `${desglose?.incidentes_investigados ?? 0}%`,
      progress: desglose?.incidentes_investigados ?? 0,
      delta: 'Del total',
      deltaPositive: (desglose?.incidentes_investigados ?? 0) >= 80,
      Icon: FileSearch,
      iconColor: 'text-sky-600 dark:text-sky-400',
      barColor: 'bg-sky-500 dark:bg-sky-400',
    },
    {
      id: 'peligros_con_control',
      label: 'Peligros con control',
      value: `${desglose?.peligros_con_control ?? 0}%`,
      progress: desglose?.peligros_con_control ?? 0,
      delta: 'Implementado',
      deltaPositive: (desglose?.peligros_con_control ?? 0) >= 80,
      Icon: ShieldCheck,
      iconColor: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500 dark:bg-amber-400',
    },
    {
      id: 'capacitaciones_realizadas',
      label: 'Capacitaciones realizadas',
      value: `${desglose?.capacitaciones_realizadas ?? 0}%`,
      progress: desglose?.capacitaciones_realizadas ?? 0,
      delta: 'Del plan anual',
      deltaPositive: (desglose?.capacitaciones_realizadas ?? 0) >= 80,
      Icon: GraduationCap,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500 dark:bg-emerald-400',
    },
    {
      id: 'nc_cerradas',
      label: 'No conformidades cerradas',
      value: `${desglose?.no_conformidades_cerradas ?? 0}%`,
      progress: desglose?.no_conformidades_cerradas ?? 0,
      delta: 'Del total',
      deltaPositive: (desglose?.no_conformidades_cerradas ?? 0) >= 80,
      Icon: CheckCircle2,
      iconColor: 'text-rose-600 dark:text-rose-400',
      barColor: 'bg-rose-500 dark:bg-rose-400',
    },
  ]

  const safetyRates = [
    {
      id: 'accidentabilidad',
      label: 'Tasa de accidentalidad',
      value: `${kpis?.tasa_accidentalidad ?? 0}%`,
      delta: `${kpis?.total_accidentes ?? 0} accidentes registrados`,
      deltaPositive: (kpis?.tasa_accidentalidad ?? 0) < 5,
      Icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'frecuencia',
      label: 'Índice de frecuencia',
      value: String(kpis?.indice_frecuencia ?? 0),
      delta: 'Por millón de horas',
      deltaPositive: true,
      Icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'severidad',
      label: 'Índice de severidad',
      value: String(kpis?.indice_severidad ?? 0),
      delta: `${kpis?.dias_perdidos ?? 0} días perdidos`,
      deltaPositive: (kpis?.dias_perdidos ?? 0) === 0,
      Icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <main
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
      style={{ background: 'transparent' }}
    >
      {selectorPeriodo}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.id} darkMode={darkMode} {...kpi} />
        ))}
      </section>

      {/* Score SG-SST destacado */}
      <div className="rounded-2xl p-5 mb-4 border flex items-center gap-5"
           style={{
             backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#1F2937' : '#E5E7EB',
             boxShadow: darkMode ? '0 8px 24px -4px rgba(255,255,255,0.08)' : '0 8px 24px -4px rgba(15,23,42,0.14)',
           }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>
          <ShieldCheck size={28} color="#fff" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium mb-0.5" style={{ color: darkMode ? '#CBD5E1' : '#6B7280' }}>
            Score SG-SST — Cumplimiento general
          </p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold" style={{ color: darkMode ? '#F9FAFB' : '#111827' }}>
              {analyticsCumplimiento?.score_total ?? 0}%
            </span>
            <span className="text-sm pb-1" style={{ color: (analyticsCumplimiento?.score_total ?? 0) >= 80 ? '#22C55E' : '#F97316' }}>
              {(analyticsCumplimiento?.score_total ?? 0) >= 80 ? 'Cumplimiento adecuado' : 'Por debajo de la meta (80%)'}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${analyticsCumplimiento?.score_total ?? 0}%`, background: 'linear-gradient(90deg,#4F46E5,#7C3AED)' }} />
          </div>
        </div>
        <p className="hidden sm:block text-xs text-right max-w-[140px]" style={{ color: darkMode ? '#CBD5E1' : '#6B7280' }}>
          Expande los acordeones para ver el desglose por indicador.
        </p>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          <MetricsAccordion
            darkMode={darkMode}
            title="Cumplimiento SG-SST"
            tooltip="Porcentajes calculados sobre el total de registros del periodo seleccionado"
            metrics={complianceMetrics}
            withProgress
          />
        </div>
        <div className="xl:col-span-1">
          <MetricsAccordion
            darkMode={darkMode}
            title="Tasas de Seguridad"
            tooltip="Índices calculados según fórmulas del Ministerio de Trabajo de Colombia"
            metrics={safetyRates}
          />
        </div>
      </section>

      <AnalyticsSummary
        darkMode={darkMode}
        incidentes={analyticsIncidentes}
        riesgos={analyticsRiesgos}
        capacitaciones={analyticsCapacitaciones}
      />

      <OverviewChart darkMode={darkMode} data={overviewData} />

      <ReportDocumentation darkMode={darkMode} />
    </main>
  )
}
