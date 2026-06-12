import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ─── Request: agrega token en cada petición ───────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pisst_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Cola para reintentos mientras se refresca el token ───────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

// ─── Response: maneja 401, 403, 503 ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status   = error.response?.status;
    const detalle  = error.response?.data?.detail || "";

    const esLogin   = original?.url?.includes("/auth/login");
    const esRefresh = original?.url?.includes("/auth/refresh");

    if (status === 403 && detalle === "debe_cambiar_password") {
      window.location.href = "/cambiar-password";
      return Promise.reject(error);
    }

    if (status === 503) {
      window.location.href = "/mantenimiento";
      return Promise.reject(error);
    }

    if (status === 401 && !esLogin && !esRefresh && !original._retry) {
      const refreshToken = sessionStorage.getItem("pisst_refresh_token");

      if (!refreshToken) {
        sessionStorage.clear();
        window.location.href = "/login?sesion=expirada";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        const newToken = data.access_token;
        sessionStorage.setItem("pisst_token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.clear();
        window.location.href = "/login?sesion=expirada";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Helper: extrae un mensaje legible de errores de la API ───────────────────
// El backend ahora valida más casos con 422, cuyo `detail` puede venir como
// string o como lista de objetos { msg, loc, type } (errores de Pydantic).
export function getErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join(" · ") || fallback;
  }
  return fallback;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  cambiarPassword: (data) => api.post("/auth/cambiar-password", data),
  forgotPassword:  (data) => api.post("/auth/forgot-password",  data),
  resetPassword:   (data) => api.post("/auth/reset-password",   data),
};

// ─── Métricas ─────────────────────────────────────────────────────────────────
export const metricasAPI = {
  getKpis:         ()        => api.get("/metricas/kpis"),
  getDashboard:    ()        => api.get("/metricas/dashboard-gerencia"),
  getAlertas:      ()        => api.get("/metricas/alertas"),
  getReportePdf:   (periodo) => api.get("/metricas/reporte-pdf",   { params: { periodo }, responseType: "blob" }),
  getReporteExcel: (periodo) => api.get("/metricas/reporte-excel", { params: { periodo }, responseType: "blob" }),
};

// ─── Incidentes ───────────────────────────────────────────────────────────────
export const incidentesAPI = {
  getAll:                 (skip = 0, limit = 50) => api.get("/incidentes/", { params: { skip, limit } }),
  getById:                (id)                   => api.get(`/incidentes/${id}`),
  create:                 (data)                 => api.post("/incidentes/", data),
  cambiarEstado:          (id, estado)           => api.patch(`/incidentes/${id}/estado`, { estado }),
  getProgreso:            (id)                   => api.get(`/incidentes/${id}/progreso`),
  getInvestigacion:       (id)                   => api.get(`/incidentes/${id}/investigacion`),
  crearInvestigacion:     (id, data)             => api.post(`/incidentes/${id}/investigacion`, data),
  actualizarInvestigacion:(id, data)             => api.patch(`/incidentes/${id}/investigacion`, data),
  getAcciones:            (id)                   => api.get(`/incidentes/${id}/acciones`),
  crearAccion:            (id, data)             => api.post(`/incidentes/${id}/acciones`, data),
  actualizarAccion:       (accionId, data)       => api.patch(`/incidentes/acciones/${accionId}`, data), // ✅ AGREGADO
  descargarFurat:         (id)                   => api.get(`/incidentes/${id}/furat`, { responseType: "blob" }),
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const usuariosAPI = {
  getAll:       (skip = 0, limit = 50)   => api.get("/usuarios/", { params: { skip, limit } }),
  getById:      (id)                     => api.get(`/usuarios/${id}`),
  create:       (data)                   => api.post("/usuarios/", data),
  update:       (id, data)               => api.patch(`/usuarios/${id}`, data),
  getMe:        ()                       => api.get("/usuarios/me"),
  updateMe:     (data)                   => api.patch("/usuarios/me", data),
  updateFoto:   (formData)               => api.put("/usuarios/me/foto", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getActividad: (limit = 10, offset = 0) => api.get("/usuarios/me/actividad", { params: { limit, offset } }),
};

// ─── Riesgos ──────────────────────────────────────────────────────────────────
export const riesgosAPI = {
  getPeligros:       (skip = 0, limit = 50) => api.get("/riesgos/peligros", { params: { skip, limit } }),
  getPeligro:        (id)                   => api.get(`/riesgos/peligros/${id}`),
  crearPeligro:      (data)                 => api.post("/riesgos/peligros", data),
  evaluar:           (id, data)             => api.post(`/riesgos/peligros/${id}/evaluar`, data),
  getMatriz:         ()                     => api.get("/riesgos/matriz"),
  crearControl:      (id, data)             => api.post(`/riesgos/peligros/${id}/controles`, data),
  actualizarControl: (id, data)             => api.patch(`/riesgos/controles/${id}`, data),
};

// ─── Áreas ────────────────────────────────────────────────────────────────────
export const areasAPI = {
  getAll: () => api.get("/areas/"),
  crear:  (data) => api.post("/areas/", data),
};

// ─── Cargos ───────────────────────────────────────────────────────────────────
export const cargosAPI = {
  getAll: () => api.get("/cargos/"),
  crear:  (data) => api.post("/cargos/", data),
};

// ─── Capacitaciones ───────────────────────────────────────────────────────────
export const capacitacionesAPI = {
  getAll:              ()                 => api.get("/capacitaciones/"),
  crear:               (data)             => api.post("/capacitaciones/", data),
  actualizar:          (id, data)         => api.patch(`/capacitaciones/${id}`, data),
  suspender:           (id)               => api.patch(`/capacitaciones/${id}`, { activo: false }),
  activar:             (id)               => api.patch(`/capacitaciones/${id}`, { activo: true }),
  getCobertura:        ()                 => api.get("/capacitaciones/cobertura"),
  getSesiones:         (id)               => api.get(`/capacitaciones/${id}/sesiones`),
  crearSesion:         (data)             => api.post("/capacitaciones/sesiones", data),
  reprogramarSesion:   (sesionId, data)   => api.patch(`/capacitaciones/sesiones/${sesionId}`, data),
  cambiarEstadoSesion: (sesionId, estado) => api.patch(`/capacitaciones/sesiones/${sesionId}/estado`, null, { params: { estado } }),
  registrarAsistencia: (data)             => api.post("/capacitaciones/asistencia", data),
  getAsistencia:       (sesionId)         => api.get(`/capacitaciones/sesiones/${sesionId}/asistencia`),
  crearEvaluacion:     (data)             => api.post("/capacitaciones/evaluaciones", data),
  responderEvaluacion: (data)             => api.post("/capacitaciones/evaluaciones/responder", data),
  getCertificado:      (evalId, empId)    => api.get(`/capacitaciones/evaluaciones/${evalId}/certificado/${empId}`, { responseType: "blob" }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getIncidentes:      () => api.get("/analytics/incidentes"),
  getRiesgos:         () => api.get("/analytics/riesgos"),
  getCapacitaciones:  () => api.get("/analytics/capacitaciones"),
  getCumplimiento:    () => api.get("/analytics/cumplimiento"),
};

// ─── Notificaciones ───────────────────────────────────────────────────────────
export const notificacionesAPI = {
  getFeed:          (limit = 10, offset = 0) => api.get("/notificaciones/feed", { params: { limit, offset } }),
  marcarLeido:      (id)                     => api.patch(`/notificaciones/${id}/leido`),
  marcarTodasLeidas:()                       => api.patch("/notificaciones/leer-todas"),
};

// ─── Chat SASBOT ──────────────────────────────────────────────────────────────
export const chatAPI = {
  enviarMensaje: (mensaje)         => api.post("/chat/mensaje", { mensaje }),
  getHistorial:  (pagina = 1, limite = 20) => api.get("/chat/historial", { params: { pagina, limite } }),
  escalar:       ()                => api.post("/chat/escalar"),
  enviarArchivo: (formData)        => api.post("/chat/archivo", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  reporteRapido: (data)            => api.post("/chat/reporte-rapido", data),
};

// ─── Auditorías ───────────────────────────────────────────────────────────────
export const auditoriasAPI = {
  getAll:        (skip = 0, limit = 50) => api.get("/auditorias/", { params: { skip, limit } }),
  crear:         (data)                 => api.post("/auditorias/", data),
  cambiarEstado: (id, estado)           => api.patch(`/auditorias/${id}/estado?estado=${estado}`),
  getProgreso:   (id)                   => api.get(`/auditorias/${id}/progreso`),
  getHallazgos:  (id)                   => api.get(`/auditorias/${id}/hallazgos`),
  crearHallazgo: (id, data)             => api.post(`/auditorias/${id}/hallazgos`, data),
  crearNC:       (hallazgoId, data)     => api.post(`/auditorias/hallazgos/${hallazgoId}/nc`, data),
  actualizarNC:  (ncId, data)           => api.patch(`/auditorias/nc/${ncId}`, data),
};