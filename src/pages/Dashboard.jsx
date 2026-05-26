import { useState, useEffect } from 'react'
import {
  AlertTriangle, Users, ClipboardList, Shield,
  ShieldCheck, FileText, GraduationCap, Clock,
  TrendingUp, AlertCircle,
} from 'lucide-react'

import KPICard from '../components/dashboard/KPICard'
import MetricsAccordion from '../components/dashboard/MetricsAccordion'
import AnnualChart from '../components/dashboard/AnnualChart'
import ReportDocumentation from '../components/dashboard/ReportDocumentation'
import { metricasAPI } from '../services/api'
import { useOutletContext } from 'react-router-dom'

const chartData = [
  { mes: 'Ene', accidentes: 12, trabajadores: 42, dias: 2 },
  { mes: 'Feb', accidentes: 14, trabajadores: 45, dias: 3 },
  { mes: 'Mar', accidentes: 18, trabajadores: 54, dias: 6 },
  { mes: 'Abr', accidentes: 15, trabajadores: 48, dias: 4 },
  { mes: 'May', accidentes: 14, trabajadores: 46, dias: 3 },
  { mes: 'Jun', accidentes: 16, trabajadores: 49, dias: 5 },
  { mes: 'Jul', accidentes: 17, trabajadores: 54, dias: 4 },
  { mes: 'Ago', accidentes: 15, trabajadores: 49, dias: 5 },
  { mes: 'Sep', accidentes: 13, trabajadores: 44, dias: 3 },
  { mes: 'Oct', accidentes: 14, trabajadores: 47, dias: 4 },
  { mes: 'Nov', accidentes: 15, trabajadores: 52, dias: 2 },
  { mes: 'Dic', accidentes: 13, trabajadores: 50, dias: 2 },
]

export default function Dashboard() {
  const { darkMode } = useOutletContext()
  const [dashboard, setDashboard] = useState(null)
  const [kpis,      setKpis]      = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      metricasAPI.getDashboard(),
      metricasAPI.getKpis(),
    ])
      .then(([dashRes, kpisRes]) => {
        setDashboard(dashRes.data)
        setKpis(kpisRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: '#9CA3AF' }}>Cargando dashboard...</p>
    </div>
  )

  const kpiCards = [
    {
      id: 'incidentes',
      label: 'Reportes activos',
      value: dashboard?.incidentes_activos ?? 0,
      delta: `${dashboard?.incidentes_ultimo_mes ?? 0} este mes`,
      deltaPositive: false,
      Icon: AlertTriangle,
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      trendColor: '#6366F1',
      trend: [10, 11, 9, 12, 10, 13, dashboard?.incidentes_activos ?? 0],
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

  const complianceMetrics = [
    {
      id: 'cumplimiento',
      label: 'Cumplimiento general',
      value: `${dashboard?.cumplimiento_sgsst ?? 0}%`,
      progress: dashboard?.cumplimiento_sgsst ?? 0,
      delta: 'SG-SST',
      deltaPositive: true,
      Icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      barColor: 'bg-indigo-500',
    },
    {
      id: 'incidentes_mes',
      label: 'Reportes último mes',
      value: String(dashboard?.incidentes_ultimo_mes ?? 0),
      progress: Math.min((dashboard?.incidentes_ultimo_mes ?? 0) * 10, 100),
      delta: 'Este mes',
      deltaPositive: (dashboard?.incidentes_ultimo_mes ?? 0) === 0,
      Icon: FileText,
      iconColor: 'text-sky-600 dark:text-sky-400',
      barColor: 'bg-sky-500',
    },
    {
      id: 'capacitaciones',
      label: 'Capacitaciones',
      value: String(dashboard?.total_capacitaciones ?? 0),
      progress: Math.min((dashboard?.total_capacitaciones ?? 0) * 20, 100),
      delta: 'Total registradas',
      deltaPositive: true,
      Icon: GraduationCap,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
    },
    {
      id: 'acciones',
      label: 'Acciones vencidas',
      value: String(dashboard?.acciones_vencidas ?? 0),
      progress: Math.min((dashboard?.acciones_vencidas ?? 0) * 20, 100),
      delta: 'Sin resolver',
      deltaPositive: dashboard?.acciones_vencidas === 0,
      Icon: Clock,
      iconColor: 'text-rose-600 dark:text-rose-400',
      barColor: 'bg-rose-500',
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
            title="Métricas Clave de Cumplimiento"
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

      <AnnualChart darkMode={darkMode} data={chartData} />

      <ReportDocumentation darkMode={darkMode} />
    </main>
  )
}