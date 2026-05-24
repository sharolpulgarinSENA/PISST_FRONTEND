import {
  AlertTriangle,
  Users,
  ClipboardList,
  Shield,
  ShieldCheck,
  FileText,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

import KPICard from '../components/dashboard/KPICard'
import MetricsAccordion from '../components/dashboard/MetricsAccordion'
import AnnualChart from '../components/dashboard/AnnualChart'
import ReportDocumentation from '../components/dashboard/ReportDocumentation'

/* ============================ MOCK DATA ============================ */
const kpis = [
  {
    id: 'incidentes',
    label: 'Incidentes abiertos',
    value: 12,
    delta: '+2 vs mes anterior',
    deltaPositive: false,
    Icon: AlertTriangle,
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    trendColor: '#6366F1',
    trend: [10, 11, 9, 12, 10, 13, 12],
  },
  {
    id: 'empleados',
    label: 'Empleados activos',
    value: 54,
    delta: '+4 vs mes anterior',
    deltaPositive: true,
    Icon: Users,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    trendColor: '#10B981',
    trend: [44, 46, 48, 49, 50, 52, 54],
  },
  {
    id: 'auditorias',
    label: 'Auditorías pendientes',
    value: 7,
    delta: '+1 vs mes anterior',
    deltaPositive: false,
    Icon: ClipboardList,
    iconBg: 'bg-orange-100 dark:bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    trendColor: '#F97316',
    trend: [4, 5, 4, 6, 5, 7, 7],
  },
  {
    id: 'riesgos',
    label: 'Riesgos críticos',
    value: 3,
    delta: '-1 vs mes anterior',
    deltaPositive: true,
    Icon: Shield,
    iconBg: 'bg-rose-100 dark:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    trendColor: '#EF4444',
    trend: [6, 5, 7, 4, 5, 4, 3],
  },
]

const complianceMetrics = [
  {
    id: 'cumplimiento',
    label: 'Cumplimiento general',
    value: '92%',
    progress: 92,
    delta: '+3% vs mes anterior',
    deltaPositive: true,
    Icon: ShieldCheck,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    barColor: 'bg-indigo-500',
  },
  {
    id: 'reportes',
    label: 'Reportes activos',
    value: '18',
    progress: 72,
    delta: '+5 vs mes anterior',
    deltaPositive: true,
    Icon: FileText,
    iconColor: 'text-sky-600 dark:text-sky-400',
    barColor: 'bg-sky-500',
  },
  {
    id: 'capacitaciones',
    label: 'Capacitaciones pendientes',
    value: '6',
    progress: 40,
    delta: '-2 vs mes anterior',
    deltaPositive: true,
    Icon: GraduationCap,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-500',
  },
  {
    id: 'acciones',
    label: 'Acciones vencidas',
    value: '4',
    progress: 35,
    delta: '-3 vs mes anterior',
    deltaPositive: true,
    Icon: Clock,
    iconColor: 'text-rose-600 dark:text-rose-400',
    barColor: 'bg-rose-500',
  },
]

const safetyRates = [
  {
    id: 'accidentabilidad',
    label: 'Porcentaje de accidentabilidad',
    value: '1.25%',
    delta: '-0.35% vs mes anterior',
    deltaPositive: true,
    Icon: ShieldCheck,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'frecuencia',
    label: 'Índice de frecuencia',
    value: '2.10',
    delta: '-0.40 vs mes anterior',
    deltaPositive: true,
    Icon: TrendingUp,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'severidad',
    label: 'Índice de severidad',
    value: '48.30',
    delta: '-5.20 vs mes anterior',
    deltaPositive: true,
    Icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
]

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

/* ============================ COMPONENT ============================ */
export default function Dashboard({ darkMode }) {
  return (
    <main
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
      style={{ backgroundColor: darkMode ? '#0B0F19' : '#F9FAFB' }}
    >
      {/* ============================ KPI CARDS ============================ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} darkMode={darkMode} {...kpi} />
        ))}
      </section>

      {/* ===================== COMPLIANCE + SAFETY RATES ==================== */}
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

      {/* =========================== ANNUAL CHART =========================== */}
      <AnnualChart darkMode={darkMode} data={chartData} />

      {/* ====================== REPORTS & DOCUMENTATION ===================== */}
      <ReportDocumentation darkMode={darkMode} />
    </main>
  )
}