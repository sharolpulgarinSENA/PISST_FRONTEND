import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ROLES } from './constants/roles'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Dashboard      = lazy(() => import('./features/sst/pages/Dashboard'))
const Chat           = lazy(() => import('./pages/Chat'))
const Incidentes     = lazy(() => import('./features/sst/pages/Incidentes'))
const Capacitaciones = lazy(() => import('./features/sst/pages/Capacitaciones'))
const Riesgos        = lazy(() => import('./features/sst/pages/Riesgos'))
const Auditorias     = lazy(() => import('./features/sst/pages/Auditorias'))
const Usuarios       = lazy(() => import('./features/sst/pages/Usuarios'))
const PerfilSST      = lazy(() => import('./features/sst/pages/PerfilSST'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'))
const Mantenimiento  = lazy(() => import('./pages/Mantenimiento'))

const EmpleadoLayout         = lazy(() => import('./features/empleado/pages/EmpleadoLayout'))
const EmpleadoChat           = lazy(() => import('./features/empleado/pages/EmpleadoChat'))
const EmpleadoReporte        = lazy(() => import('./features/empleado/pages/EmpleadoReporte'))
const EmpleadoPerfil         = lazy(() => import('./features/empleado/pages/EmpleadoPerfil'))
const EmpleadoCapacitaciones = lazy(() => import('./features/empleado/pages/EmpleadoCapacitaciones'))

const AdminLayout    = lazy(() => import('./features/admin/pages/AdminLayout'))
const AdminEmpresas  = lazy(() => import('./features/admin/pages/AdminEmpresas'))
const AdminUsuarios  = lazy(() => import('./features/admin/pages/AdminUsuarios'))

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  const userRole = user?.role?.toString?.().toLowerCase?.()
  if (roles && !roles.map(r => r.toString().toLowerCase()).includes(userRole)) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen"
           style={{ backgroundColor: localStorage.getItem('pisst_theme') === 'light' ? '#F9FAFB' : '#0B0F19' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
    <ErrorBoundary>
    <Routes>
      {/* ── Rutas públicas (sin Layout, accesibles sin sesión) ── */}
      <Route path="/"                element={<Landing />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/cambiar-password" element={<CambiarPassword />} />
      <Route path="/mantenimiento"   element={<Mantenimiento />} />

      {/* ── Páginas protegidas (todas dentro del Layout) ── */}
      <Route element={<Layout />}>
        <Route path="/dashboard"      element={<PrivateRoute roles={[ROLES.SST,ROLES.GERENCIA]}><Dashboard /></PrivateRoute>} />
        <Route path="/chat"           element={<PrivateRoute roles={[ROLES.SST,ROLES.GERENCIA]}><Chat /></PrivateRoute>} />
        <Route path="/incidentes"     element={<PrivateRoute roles={[ROLES.SST,ROLES.GERENCIA]}><Incidentes /></PrivateRoute>} />
        <Route path="/capacitaciones" element={<PrivateRoute roles={[ROLES.SST]}><Capacitaciones /></PrivateRoute>} />
        <Route path="/riesgos"        element={<PrivateRoute roles={[ROLES.SST]}><Riesgos /></PrivateRoute>} />
        <Route path="/auditorias"     element={<PrivateRoute roles={[ROLES.SST]}><Auditorias /></PrivateRoute>} />
        <Route path="/usuarios"       element={<PrivateRoute roles={[ROLES.SST]}><Usuarios /></PrivateRoute>} />
        <Route path="/perfil"         element={<PrivateRoute roles={[ROLES.SST,ROLES.GERENCIA]}><PerfilSST /></PrivateRoute>} />
      </Route>

      {/* ── Páginas del rol empleado (layout propio) ── */}
      <Route path="/empleado" element={<PrivateRoute roles={[ROLES.EMPLEADO]}><EmpleadoLayout /></PrivateRoute>}>
        <Route index               element={<Navigate to="chat" replace />} />
        <Route path="chat"          element={<EmpleadoChat />} />
        <Route path="reporte"       element={<EmpleadoReporte />} />
        <Route path="perfil"        element={<EmpleadoPerfil />} />
        <Route path="capacitaciones" element={<EmpleadoCapacitaciones />} />
      </Route>

      {/* ── Páginas del rol admin (layout propio) ── */}
      <Route path="/admin" element={<PrivateRoute roles={[ROLES.ADMIN]}><AdminLayout /></PrivateRoute>}>
        <Route index           element={<Navigate to="empresas" replace />} />
        <Route path="empresas" element={<AdminEmpresas />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </ErrorBoundary>
    </Suspense>
  )
}