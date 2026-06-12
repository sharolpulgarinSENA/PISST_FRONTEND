import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

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
  const { user } = useAuth()
  const userRole = user?.role?.toString?.().toLowerCase?.()

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#0B0F19' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
    <Routes>
      {/* ── Rutas públicas (sin Layout, accesibles sin sesión) ── */}
      <Route path="/login"           element={<Login />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/cambiar-password" element={<CambiarPassword />} />
      <Route path="/mantenimiento"   element={<Mantenimiento />} />

      {/* ── Redirección raíz según rol ── */}
      <Route path="/" element={
        <PrivateRoute>
          {userRole === 'sst'      ? <Navigate to="/dashboard" replace /> :
           userRole === 'gerencia' ? <Navigate to="/dashboard" replace /> :
           userRole === 'empleado' ? <Navigate to="/chat" replace /> :
           <Navigate to="/login" replace />}
        </PrivateRoute>
      }/>

      {/* ── Páginas protegidas (todas dentro del Layout) ── */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard"      element={<PrivateRoute roles={['sst','gerencia']}><Dashboard /></PrivateRoute>} />
        <Route path="/chat"           element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/incidentes"     element={<PrivateRoute><Incidentes /></PrivateRoute>} />
        <Route path="/capacitaciones" element={<PrivateRoute roles={['sst']}><Capacitaciones /></PrivateRoute>} />
        <Route path="/riesgos"        element={<PrivateRoute roles={['sst']}><Riesgos /></PrivateRoute>} />
        <Route path="/auditorias"     element={<PrivateRoute roles={['sst']}><Auditorias /></PrivateRoute>} />
        <Route path="/usuarios"       element={<PrivateRoute roles={['sst']}><Usuarios /></PrivateRoute>} />
        <Route path="/perfil"         element={<PrivateRoute><PerfilSST /></PrivateRoute>} />
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  )
}