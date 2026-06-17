# PISST Frontend

Frontend del **Sistema de Información para la Seguridad y Salud en el Trabajo (PISST)**, desarrollado como proyecto académico en el SENA.

Permite a coordinadores SST, gerencia y empleados gestionar incidentes, riesgos, auditorías, capacitaciones y usuarios, con soporte de un asistente virtual (SASBOT).

---

## Stack

| Tecnología | Versión |
|---|---|
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 3 |
| React Router | 7 |
| Axios | 1 |
| Recharts | 3 |

Backend: FastAPI desplegado en [Render](https://render.com).  
Frontend: desplegado en [Vercel](https://vercel.com).

---

## Requisitos previos

- Node.js ≥ 20
- npm ≥ 10
- Acceso a la instancia del backend (ver `.env`)

---

## Configuración local

```bash
# 1. Clonar el repositorio y entrar al directorio
git clone <repo-url>
cd pisst-frontend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend FastAPI (sin barra final) |
| `VITE_RECAPTCHA_SITE_KEY` | Clave pública de reCAPTCHA v2 |

Copia `.env.example` como `.env` y completa los valores. **Nunca subas `.env` al repositorio** (ya está en `.gitignore`).

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar el build localmente |
| `npm run lint` | Ejecutar ESLint |

---

## Estructura del proyecto

```
src/
├── assets/          # Imágenes y recursos estáticos
├── components/      # Componentes reutilizables (Layout, ConfirmDialog, Spinner…)
│   ├── chat/        # Widget SASBOT
│   └── layout/      # Sidebar, Navbar, MobileBottomNav
├── constants/       # Constantes globales (roles.js)
├── context/         # AuthContext, ThemeContext
├── features/        # Módulos por rol
│   ├── sst/         # Incidentes, Riesgos, Auditorías, Capacitaciones, Usuarios
│   └── empleado/    # Perfil, Capacitaciones, Reportes del empleado
├── hooks/           # Hooks reutilizables (useModal, usePaginacion…)
├── pages/           # Páginas generales (Login, Chat, ResetPassword…)
├── services/        # api.js — cliente Axios con interceptores JWT
└── utils/           # Utilidades puras (dates.js)
```

---

## Roles del sistema

| Rol | Constante | Acceso |
|---|---|---|
| Coordinador SST | `ROLES.SST` | Dashboard completo, gestión de usuarios, todos los módulos |
| Gerencia | `ROLES.GERENCIA` | Dashboard de reportes e incidentes (solo lectura) |
| Empleado | `ROLES.EMPLEADO` | Perfil, capacitaciones propias, reporte rápido vía SASBOT |

---

## Despliegue en Vercel

El archivo `vercel.json` configura:
- Rewrite SPA: todas las rutas sirven `index.html`
- Cabeceras de seguridad: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

En el panel de Vercel, configura las variables de entorno por separado para **Production** (backend en Render) y **Preview** (backend de staging).

---

## Notas de seguridad

- Los tokens JWT se almacenan en `sessionStorage`. La migración a cookies `httpOnly` está documentada en `BACKEND_PENDIENTE.md` (Sección 8) y debe coordinarse con el equipo backend.
- La clave de reCAPTCHA es pública por diseño — no es un secreto.
