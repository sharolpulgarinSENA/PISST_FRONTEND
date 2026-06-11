import { useState, useEffect } from 'react'
import {
  AlertTriangle, Users, Shield,
  ShieldCheck, FileText, GraduationCap, Clock,
  TrendingUp, AlertCircle, CheckCircle2, FileSearch,
} from 'lucide-react'

import KPICard from '../components/dashboard/KPICard'
import MetricsAccordion from '../components/dashboard/MetricsAccordion'
import OverviewChart from '../components/dashboard/OverviewChart'
import AnalyticsSummary from '../components/dashboard/AnalyticsSummary'
import ReportDocumentation from '../components/dashboard/ReportDocumentation'
import { metricasAPI, analyticsAPI } from '../services/api'
import { useOutletContext } from 'react-router-dom'

export default function Dashboard() {
  const { darkMode } = useOutletContext()
  const [dashboard, setDashboard] = useState(null)
  const [analyticsIncidentes, setAnalyticsIncidentes] = useState(null)
  const [analyticsRiesgos, setAnalyticsRiesgos] = useState(null)
  const [analyticsCapacitaciones, setAnalyticsCapacitaciones] = useState(null)
  const [analyticsCumplimiento, setAnalyticsCumplimiento] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      metricasAPI.getDashboard(),
      analyticsAPI.getIncidentes(),
      analyticsAPI.getRiesgos(),
      analyticsAPI.getCapacitaciones(),
      analyticsAPI.getCumplimiento(),
    ])
      .then(([dashRes, incRes, riesgosRes, capRes, cumpRes]) => {
        setDashboard(dashRes.data)
        setAnalyticsIncidentes(incRes.data)
        setAnalyticsRiesgos(riesgosRes.data)
        setAnalyticsCapacitaciones(capRes.data)
        setAnalyticsCumplimiento(cumpRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}>Cargando dashboard...</p>
    </div>
  )

  const kpis = dashboard?.kpis

  const kpiCards = [
    {
      id: 'incidentes',
      label: 'Reportes (total / activos)',
      value: analyticsIncidentes?.total_incidentes ?? 0,
      delta: `${dashboard?.incidentes_activos ?? 0} activos`,
      deltaPositive: false,
      Icon: AlertTriangle,
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      trendColor: '#6366F1',
      trend: [10, 11, 9, 12, 10, 13, analyticsIncidentes?.total_incidentes ?? 0],
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
      trendColor: '#10B981',
      trend: [44, 46, 48, 49, 50, 52, kpis?.total_trabajadores ?? 0],
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
      trendColor: '#F97316',
      trend: [4, 5, 4, 6, 5, 7, dashboard?.total_capacitaciones ?? 0],
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
      trendColor: '#EF4444',
      trend: [6, 5, 7, 4, 5, 4, dashboard?.acciones_vencidas ?? 0],
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
      id: 'cumplimiento',
      label: 'Score SG-SST',
      value: `${analyticsCumplimiento?.score_total ?? 0}%`,
      progress: analyticsCumplimiento?.score_total ?? 0,
      delta: 'General',
      deltaPositive: true,
      Icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      barColor: 'bg-indigo-500 dark:bg-indigo-400',
    },
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
      style={{ backgroundColor: darkMode ? '#0B0F19' : '#F9FAFB' }}
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.id} darkMode={darkMode} {...kpi} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          <MetricsAccordion
            darkMode={darkMode}
            title="Cumplimiento SG-SST"
            metrics={complianceMetrics}
            withProgress
            defaultOpen
          />
        </div>
        <div className="xl:col-span-1">
          <MetricsAccordion
            darkMode={darkMode}
            title="Tasas de Seguridad"
            metrics={safetyRates}
            defaultOpen
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
