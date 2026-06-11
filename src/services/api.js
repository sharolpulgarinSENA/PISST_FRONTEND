// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor: agrega el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pisst_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si el backend responde 401 en rutas protegidas, limpiar sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !esRutaLogin) {
      const detalle = error.response?.data?.detail || "";
      sessionStorage.removeItem("pisst_token");
      sessionStorage.removeItem("pisst_user");
      const motivo = detalle.toLowerCase().includes("dispositivo")
        ? "dispositivo"
        : "expirada";
      window.location.href = `/login?sesion=${motivo}`;
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Métricas ──────────────────────────────────────────────────────
export const metricasAPI = {
  getKpis:      () => api.get('/metricas/kpis'),
  getDashboard: () => api.get('/metricas/dashboard-gerencia'),
  getAlertas:   () => api.get('/metricas/alertas'),
}

// ── Incidentes ────────────────────────────────────────────────────
export const incidentesAPI = {
  getAll:             ()           => api.get('/incidentes/'),
  getById:            (id)         => api.get(`/incidentes/${id}`),
  create:             (data)       => api.post('/incidentes/', data),
  cambiarEstado:      (id, estado) => api.patch(`/incidentes/${id}/estado`, { estado }),
  getProgreso:        (id)         => api.get(`/incidentes/${id}/progreso`),
  crearInvestigacion: (id, data)   => api.post(`/incidentes/${id}/investigacion`, data),
  crearAccion:        (id, data)   => api.post(`/incidentes/${id}/acciones`, data),
  descargarFurat:     (id)         => api.get(`/incidentes/${id}/furat`, { responseType: 'blob' }),
}

// ── Usuarios ──────────────────────────────────────────────────────
export const usuariosAPI = {
  getAll:  ()         => api.get('/usuarios/'),
  getById: (id)       => api.get(`/usuarios/${id}`),
  create:  (data)     => api.post('/usuarios/', data),
  update:  (id, data) => api.patch(`/usuarios/${id}`, data),
}

// ── Riesgos ───────────────────────────────────────────────────────
export const riesgosAPI = {
  getPeligros:       ()          => api.get('/riesgos/peligros'),
  getPeligro:        (id)        => api.get(`/riesgos/peligros/${id}`),
  crearPeligro:      (data)      => api.post('/riesgos/peligros', data),
  evaluar:           (id, data)  => api.post(`/riesgos/peligros/${id}/evaluar`, data),
  getMatriz:         ()          => api.get('/riesgos/matriz'),
  crearControl:      (id, data)  => api.post(`/riesgos/peligros/${id}/controles`, data),
  actualizarControl: (id, data)  => api.patch(`/riesgos/controles/${id}`, data),
}

// ── Capacitaciones ────────────────────────────────────────────────
export const capacitacionesAPI = {
  getAll:               ()              => api.get('/capacitaciones/'),
  crear:                (data)          => api.post('/capacitaciones/', data),
  getCobertura:         ()              => api.get('/capacitaciones/cobertura'),
  getSesiones:          (id)            => api.get(`/capacitaciones/${id}/sesiones`),
  crearSesion:          (data)          => api.post('/capacitaciones/sesiones', data),
  registrarAsistencia:  (data)          => api.post('/capacitaciones/asistencia', data),
  getAsistencia:        (sesionId)      => api.get(`/capacitaciones/sesiones/${sesionId}/asistencia`),
  crearEvaluacion:      (data)          => api.post('/capacitaciones/evaluaciones', data),
  responderEvaluacion:  (data)          => api.post('/capacitaciones/evaluaciones/responder', data),
  getCertificado:       (evalId, empId) =>
    api.get(`/capacitaciones/evaluaciones/${evalId}/certificado/${empId}`, { responseType: 'blob' }),
  getHistorialEmpleado: (empId)         => api.get(`/capacitaciones/empleados/${empId}/historial`),
}

// ── Auditorías ────────────────────────────────────────────────────
export const auditoriasAPI = {
  getAll:        ()                 => api.get('/auditorias/'),
  crear:         (data)             => api.post('/auditorias/', data),
  cambiarEstado: (id, estado)       => api.patch(`/auditorias/${id}/estado?estado=${estado}`),
  getProgreso:   (id)               => api.get(`/auditorias/${id}/progreso`),
  getHallazgos:  (id)               => api.get(`/auditorias/${id}/hallazgos`),
  crearHallazgo: (id, data)         => api.post(`/auditorias/${id}/hallazgos`, data),
  crearNC:       (hallazgoId, data) => api.post(`/auditorias/hallazgos/${hallazgoId}/nc`, data),
  actualizarNC:  (ncId, data)       => api.patch(`/auditorias/nc/${ncId}`, data),
}

// ── Chat SASBOT (Empleado) ────────────────────────────────────────
export const chatAPI = {
  // POST /chat/mensaje → { mensaje }
  enviarMensaje: (mensaje) => api.post('/chat/mensaje', { mensaje }),

  // GET /chat/historial → paginado
  getHistorial: (pagina = 1, limite = 20) =>
    api.get('/chat/historial', { params: { pagina, limite } }),

  // POST /chat/reporte-rapido → { tipo, descripcion, lugar }
  reporteRapido: (data) => api.post('/chat/reporte-rapido', data),

  // POST /chat/escalar → { motivo? }
  // Notifica al Coordinador SST con el historial de la conversación
  escalar: (motivo = 'El empleado solicitó hablar con el Coordinador SST.') =>
    api.post('/chat/escalar', { motivo }),

  // POST /chat/adjunto → FormData con campo "archivo"
  // Sube un archivo (PDF, JPG, PNG, DOC, DOCX — máx 10MB)
  subirAdjunto: (formData) =>
    api.post('/chat/adjunto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// ── Notificaciones ────────────────────────────────────────────────
export const notificacionesAPI = {
  getFeed:     ()   => api.get('/notificaciones/feed'),
  marcarLeida: (id) => api.patch(`/notificaciones/${id}/leido`),
  marcarTodas: ()   => api.patch('/notificaciones/leido-todas'),
}