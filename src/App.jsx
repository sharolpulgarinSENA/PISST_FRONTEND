import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout general (sst / gerencia)
import Layout from './components/Layout'

// Páginas SST / Gerencia
import Login          from './pages/login'
import Dashboard      from './pages/Dashboard'
import Chat           from './pages/Chat'
import Incidentes     from './pages/Incidentes'
import Capacitaciones from './pages/Capacitaciones'
import Riesgos        from './pages/Riesgos'
import Auditorias     from './pages/Auditorias'
import Usuarios       from './pages/Usuarios'
import ResetPassword  from './pages/ResetPassword'

// Layout y páginas del empleado
import EmpleadoLayout         from './pages/EmpleadoLayout'
import EmpleadoChat           from './pages/EmpleadoChat'
import EmpleadoReporte        from './pages/EmpleadoReporte'
import EmpleadoPerfil         from './pages/EmpleadoPerfil'
import EmpleadoCapacitaciones from './pages/EmpleadoCapacitaciones'

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  const userRole = user?.role?.toString().toLowerCase()
  if (roles && !roles.map(r => r.toLowerCase()).includes(userRole))
    return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const rol = user?.role?.toString().toLowerCase()

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"          element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Redirect raíz según rol */}
      <Route path="/" element={
        <PrivateRoute>
          {rol === 'sst' || rol === 'gerencia'
            ? <Navigate to="/dashboard"    replace />
            : rol === 'empleado'
              ? <Navigate to="/empleado/chat" replace />
              : <Navigate to="/login"      replace />}
        </PrivateRoute>
      } />

      {/* ── RUTAS EMPLEADO — layout propio con sidebar PISST ── */}
      <Route path="/empleado" element={
        <PrivateRoute roles={['empleado']}>
          <EmpleadoLayout />
        </PrivateRoute>
      }>
        <Route index                  element={<Navigate to="chat" replace />} />
        <Route path="chat"            element={<EmpleadoChat />} />
        <Route path="reporte"         element={<EmpleadoReporte />} />
        <Route path="perfil"          element={<EmpleadoPerfil />} />
        <Route path="capacitaciones"  element={<EmpleadoCapacitaciones />} />
      </Route>

      {/* ── RUTAS SST / GERENCIA — Layout compartido ── */}
      <Route element={
        <PrivateRoute roles={['sst', 'gerencia']}>
          <Layout />
        </PrivateRoute>
      }>
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/chat"           element={<Chat />} />
        <Route path="/incidentes"     element={<Incidentes />} />
        <Route path="/capacitaciones" element={<PrivateRoute roles={['sst']}><Capacitaciones /></PrivateRoute>} />
        <Route path="/riesgos"        element={<PrivateRoute roles={['sst']}><Riesgos /></PrivateRoute>} />
        <Route path="/auditorias"     element={<PrivateRoute roles={['sst']}><Auditorias /></PrivateRoute>} />
        <Route path="/usuarios"       element={<PrivateRoute roles={['sst']}><Usuarios /></PrivateRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
