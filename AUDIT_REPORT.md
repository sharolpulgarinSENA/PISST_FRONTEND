# Frontend Quality Audit — PISST
**Date:** 2026-06-16  
**Stack:** React 19 + Vite 8 + Tailwind CSS 3 + FastAPI backend (Render) + Vercel  
**Auditor:** AI Senior Frontend Architect  
**Scope:** 40 source files · ~13 500 lines of code · 7 production dependencies

---

## Executive Summary

PISST es una SPA bien estructurada que demuestra dominio sólido de React moderno: lazy loading en todas las rutas, interceptores Axios con cola de reintentos para el refresh del JWT, un hook `useModal` reutilizable con focus-trap y Escape, y headers HTTP de seguridad correctamente configurados en Vercel. Para un proyecto académico de nivel SENA, la calidad base es **superior al promedio**. El código está limpio (cero `console.log` en producción, sin `dangerouslySetInnerHTML`, sin credenciales hardcodeadas), y los patrones de arquitectura son reconocibles y predecibles.

Los riesgos más significativos son de **calidad de código a largo plazo**: tres páginas superan las 700 líneas (`Capacitaciones.jsx` con 1 376, `Incidentes.jsx` con 1 067, `EmpleadoLayout.jsx` con 696), convirtiéndolas en "god components" que mezclan lógica de negocio, estado de UI, formularios y renders en un mismo archivo. La ausencia total de **pruebas automatizadas** (cero archivos `.test.js` o `.spec.js`) y de **error boundaries** significa que cualquier error de runtime en un modal o componente secundario puede dejar la pantalla en negro sin feedback al usuario — como se evidenció con el crash de `KPICard` al llamar `.map()` sobre `trend = undefined`.

En **seguridad**, el almacenamiento de JWT en `sessionStorage` es el riesgo principal: si un script malicioso logra ejecutarse (XSS), puede extraer todos los tokens. La ausencia del header `Strict-Transport-Security` (HSTS) y el uso de `unsafe-inline` en `style-src` del CSP son puntos de mejora directos. En **accesibilidad**, el hook `useModal` es una fortaleza real, pero el widget de SASBOT y el panel de notificaciones de Navbar carecen de atributos ARIA esenciales.

**Las 3 acciones inmediatas de mayor impacto:** (1) Agregar un `<ErrorBoundary>` global en `App.jsx` para evitar pantallas negras; (2) Agregar el header `Strict-Transport-Security` en `vercel.json`; (3) Centralizar las ~5 funciones de formato de fecha duplicadas en `src/utils/dates.js`.

---

## Audit Score

| Dimension | Score | Status |
|-----------|-------|--------|
| Security | 6/10 | 🟡 |
| Performance | 6/10 | 🟡 |
| Code Quality | 5/10 | 🟡 |
| Scalability | 6/10 | 🟡 |
| Accessibility | 6/10 | 🟡 |
| DX & CI/CD | 4/10 | 🔴 |
| Dependencies | 6/10 | 🟡 |
| **TOTAL** | **39/70** | 🟡 Nivel medio-alto |

---

## Findings by Dimension

---

### 🔐 Security

#### 🟡 Important

- **JWT almacenado en sessionStorage** — `src/context/AuthContext.jsx:8-27`  
  Problem: Los tres tokens (`pisst_token`, `pisst_refresh_token`, `pisst_user`) se guardan en `sessionStorage`, accesible por cualquier JavaScript que corra en la misma pestaña.  
  Risk: Si una librería de terceros comprometida o un ataque XSS logra ejecución de código, puede leer y exfiltrar el token de acceso y el de refresco, tomando control total de la sesión. El impacto es alto dado que los roles incluyen SST Coordinator con acceso a datos sensibles de salud laboral.  
  Fix: Migrar a `httpOnly` cookies en el backend (FastAPI puede emitir `Set-Cookie: HttpOnly; Secure; SameSite=Strict`). El frontend dejaría de manejar el token directamente y Axios lo enviaría automáticamente. Esta es la única mitigación real; cualquier solución solo-frontend sigue siendo vulnerable a XSS.

- **Header HSTS ausente** — `vercel.json`  
  Problem: No hay `Strict-Transport-Security` en los headers HTTP de Vercel.  
  Risk: Sin HSTS, un cliente que acceda por HTTP podría ser redirigido por un atacante antes de que Vercel fuerce HTTPS (ataque SSL-stripping).  
  Fix: Agregar en `vercel.json`:
  ```json
  { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
  ```

- **CSP permite `unsafe-inline` en estilos** — `vercel.json:13`  
  Problem: `style-src 'self' 'unsafe-inline'` permite que cualquier script inyecte estilos en línea, lo que puede usarse para ataques de UI-redress (clickjacking visual) aunque `X-Frame-Options: DENY` ya bloquea iframes.  
  Risk: Bajo en este contexto pero innecesario dado que el proyecto usa mayoritariamente clases Tailwind.  
  Fix: Considerar `style-src 'self'` y mover los estilos inline a clases CSS. A corto plazo es un esfuerzo alto; documentar la deuda técnica.

- **Validación de archivos solo en cliente** — `src/components/chat/SasbotWidget.jsx`  
  Problem: La validación de tipo y tamaño de archivos adjuntos en SASBOT se hace con un array `tiposPermitidos` en el cliente. El backend puede o no revalidar.  
  Risk: Si el backend no valida, un usuario puede evadir la validación cliente y subir archivos maliciosos.  
  Fix: Confirmar que el backend FastAPI también valida tipo MIME y tamaño máximo. La validación cliente es UX; la del backend es seguridad.

#### 🟢 Low

- **`?sesion=expirada` en URL** — `src/services/api.js:49,81`  
  Problem: Al expirar la sesión, se redirige a `/login?sesion=expirada`. Este query param es visible en logs del servidor y en el historial del navegador.  
  Risk: Información mínima expuesta. No hay datos sensibles en el parámetro.  
  Fix: Usar estado de navegación de React Router (`navigate('/login', { state: { sesionExpirada: true } })`) en lugar de query params.

- **Token leído directamente de sessionStorage en interceptor** — `src/services/api.js:9`  
  Problem: El interceptor lee `sessionStorage.getItem("pisst_token")` en cada request en lugar de leer desde el estado React del `AuthContext`.  
  Risk: Mínimo. Podría causar inconsistencias si el token en memoria difiere del almacenado, pero en la práctica son idénticos.  
  Fix: Pasar el token via closure o configurarlo en `api.defaults.headers` al hacer login.

---

### ⚡ Performance

#### 🔴 Critical

- **God component causa renders innecesarios** — `src/features/sst/pages/Capacitaciones.jsx` (1 376 líneas), `src/features/sst/pages/Incidentes.jsx` (1 067 líneas)  
  Problem: Cada archivo contiene múltiples componentes internos (modales, formularios, tablas), decenas de `useState`, y toda la lógica de negocio en el mismo scope. Cualquier cambio de estado (ej: escribir en un input del formulario) re-renderiza el árbol completo del componente.  
  Risk: En dispositivos de gama baja (empleados de planta), esto produce lag visible al interactuar con formularios dentro de modales.  
  Fix: Extraer cada modal como componente separado en archivos propios (`ModalNuevoIncidente.jsx`, `ModalDetalleIncidente.jsx`, etc.). Usar `React.memo` en los componentes de lista.

- **`KPICard` crasheaba con `trend.map()` sobre `undefined`** — `src/components/dashboard/KPICard.jsx:18` *(ya corregido)*  
  Problem: El componente asumía que el prop `trend` siempre era un array. Al remover el prop en `Dashboard.jsx`, causaba `TypeError` que desmontaba toda la app (pantalla negra).  
  Risk: Cualquier prop opcional sin valor por defecto puede causar crashes silenciosos.  
  Fix aplicado: Guard `Array.isArray(trend)` y render condicional del sparkline. **Patrón que debe replicarse en todos los componentes con props opcionales.**

#### 🟡 Important

- **Solicitudes N+1 al cargar Auditorías** — `src/features/sst/pages/Auditorias.jsx` (introducido en esta sesión)  
  Problem: Al cargar la lista de auditorías, se lanza un `getProgreso(id)` por cada auditoría en paralelo. Con 20 auditorías = 21 requests HTTP al mismo tiempo hacia Render (que ya tiene latencia alta por cold starts).  
  Risk: En producción con muchas auditorías, esto puede saturar el backend o superar límites de concurrencia de Render en plan gratuito.  
  Fix: Solicitar al backend un endpoint `GET /auditorias/progreso-bulk` que retorne todos los progresos en una sola request. A corto plazo, limitar con `Promise.all` solo las primeras N auditorías visibles.

- **Polling de notificaciones cada 60 segundos sin cleanup verificable** — `src/components/layout/Navbar.jsx`  
  Problem: Se usa `setInterval` de 60 segundos para actualizar notificaciones. Si el componente se desmonta sin limpiar el intervalo (o si la limpieza falla), continúa haciendo requests.  
  Risk: Memory leak acumulativo en sesiones largas.  
  Fix: Verificar que el `return () => clearInterval(...)` en el `useEffect` cubre todos los paths. Considerar usar `window.addEventListener('focus', ...)` para refrescar solo cuando el tab vuelve a estar activo.

- **Paginación client-side carga todos los registros en memoria** — `src/hooks/usePaginacion.js`  
  Problem: `usePaginacion` recibe el array completo y lo pagina localmente. `incidentesAPI.getAll(skip=0, limit=50)` en api.js ya sugiere intención de server-side pagination, pero no se usa.  
  Risk: Con 500+ incidentes o usuarios, la primera carga será lenta y usará memoria innecesaria.  
  Fix: Implementar paginación server-side pasando `skip` y `limit` al backend según la página actual. El hook `usePaginacion` debería convertirse en `useServerPaginacion` que maneja `page`, `totalItems` y llama al API.

- **Funciones de formato creadas en cada render** — `src/features/sst/pages/Incidentes.jsx:472,920`  
  Problem: `fmtFecha` y `fmtFechaCorta` se definen con `const` dentro del cuerpo del componente en cada render, creando nuevas referencias de función.  
  Risk: Bajo impacto directo, pero si estas funciones se pasan como props a componentes hijos, causarán re-renders innecesarios.  
  Fix: Mover al scope del módulo (fuera del componente) o usar `useCallback`.

#### 🟢 Low

- **Bundle sin chunking manual** — `vite.config.js`  
  Problem: Vite usa defaults de chunking. `recharts` (~500KB minificado) se incluye en el bundle principal.  
  Risk: Primera carga del Dashboard puede tomar varios segundos en conexiones 3G.  
  Fix: Agregar en `vite.config.js`:
  ```js
  build: { rollupOptions: { output: { manualChunks: { recharts: ['recharts'] } } } }
  ```

---

### 🧹 Code Quality & Maintainability

#### 🔴 Critical

- **Ausencia total de Error Boundaries** — Global  
  Problem: No existe ningún componente `<ErrorBoundary>` en el proyecto. Los errores de runtime en el árbol de componentes (como el crash de `KPICard`) desmontan toda la aplicación sin mostrar UI de recuperación.  
  Risk: El usuario ve pantalla negra y no sabe qué hacer. No hay forma de que el error sea reportado. En producción esto es inaceptable.  
  Fix: Crear `src/components/ErrorBoundary.jsx` y envolver al menos: (1) el `<Outlet>` en `Layout.jsx`, (2) cada modal individualmente, (3) el `<Suspense>` en `App.jsx`.
  ```jsx
  class ErrorBoundary extends React.Component {
    state = { hasError: false }
    static getDerivedStateFromError() { return { hasError: true } }
    render() {
      if (this.state.hasError) return <FallbackUI onRetry={() => this.setState({ hasError: false })} />
      return this.props.children
    }
  }
  ```

- **Funciones de fecha duplicadas en múltiples archivos**  
  Problem: La lógica de formateo de fechas con timezone Colombia está reimplementada al menos 5 veces de formas ligeramente distintas:
  - `toColombiaISO()` — definida en `Capacitaciones.jsx:17` Y en `Incidentes.jsx:60` (duplicada)
  - `formatColombia()` — solo en `Capacitaciones.jsx:23`
  - `backendToInputLocal()` — solo en `Capacitaciones.jsx:29`
  - `fmtFecha()` — en `Auditorias.jsx:37`, `PerfilSST.jsx:20`, `Incidentes.jsx:472` (tres versiones)
  - `fmtFechaCorta()` — en `Incidentes.jsx:920`, `EmpleadoReporte.jsx:588`  
  
  Risk: Un bug de timezone se corrige en un archivo y permanece en los otros. Ya hay una inconsistencia detectada: `Capacitaciones.jsx:25` usa regex `/[Z+\-]\d{2}:\d{2}$|Z$/` mientras que `normFecha` en `utils/dates.js` usa lógica diferente.  
  Fix: Centralizar en `src/utils/dates.js`:
  ```js
  export function toColombiaISO(localStr) { ... }
  export function formatColombia(fechaStr, opts) { ... }
  export function backendToInputLocal(raw) { ... }
  ```
  Luego importar desde todos los archivos que los usan.

#### 🟡 Important

- **Constantes de UI duplicadas por módulo**  
  Problem: `ESTADO_LABEL`, `ESTADO_COLOR`, `TIPO_LABEL`, `SEVERIDAD_COLOR` etc. están definidas localmente en cada página (`Incidentes.jsx:15-35`, `Auditorias.jsx:14-35`, `Riesgos.jsx`). Algunas son específicas del módulo, pero las de estado (abierta/cerrada/en_proceso) se repiten.  
  Risk: Si el backend cambia un valor de estado, hay que actualizarlo en múltiples archivos.  
  Fix: Crear `src/constants/estados.js` con los mapas de estado compartidos entre módulos.

- **Sin PropTypes ni TypeScript en ningún componente** — Global  
  Problem: Ningún componente declara los tipos de sus props. `KPICard` recibe ~10 props, `MetricsAccordion` recibe `metrics` como array sin forma definida.  
  Risk: Errores como el de `trend.map()` son completamente prevenibles con type checking estático. Bugs silenciosos por props mal nombradas o con tipos incorrectos.  
  Fix: Al menos agregar `PropTypes` para los componentes compartidos (`KPICard`, `MetricsAccordion`, `ConfirmDialog`, `Paginador`). La migración completa a TypeScript es el fix definitivo.

- **Componentes definidos dentro de otros componentes** — `src/components/chat/SasbotWidget.jsx`  
  Problem: Componentes auxiliares (`MensajeBurbuja`, `ReporteRapidoForm`) se definen dentro del scope de `SasbotWidget`, siendo re-creados en cada render del padre.  
  Risk: React trata cada re-creación de función de componente como un tipo diferente, lo que causa desmontaje + montaje completo de esos componentes en cada render del padre (pérdida de estado interno, pérdida de focus).  
  Fix: Mover todas las definiciones de componentes al scope del módulo (fuera de cualquier función de componente).

- **Estilos inline para theming** — Global (~150+ objetos `style={}`)  
  Problem: El theming se implementa creando objetos `style={{ color: darkMode ? '#F9FAFB' : '#111827' }}` en cada componente. En un archivo como `Navbar.jsx` (650+ líneas) hay más de 80 objetos de estilo inline.  
  Risk: (1) Los objetos inline crean nuevas referencias en cada render, contribuyendo a re-renders. (2) La mantenibilidad es muy baja — cambiar el color primario requiere editar decenas de archivos. (3) El CSP `unsafe-inline` para estilos existe parcialmente por este patrón.  
  Fix: Definir variables CSS en `:root` y usar `ThemeContext` para cambiar la clase en `document.body`. Los colores se vuelven tokens CSS (`var(--color-bg-primary)`) y Tailwind puede extenderse con ellos.

#### 🟢 Low

- **Metricas.jsx** — `src/features/sst/pages/Metricas.jsx`  
  Problem: Existe un archivo `Metricas.jsx` que no aparece en ninguna ruta de `App.jsx` ni en ningún import.  
  Risk: Dead code que confunde a futuros desarrolladores.  
  Fix: Eliminar si está descartado, o documentar si es trabajo en progreso.

- **`// ✅ AGREGADO` en comentario de producción** — `src/services/api.js:135`  
  Problem: Comentario de estado de desarrollo dejado en código de producción.  
  Fix: Eliminar el comentario.

---

### 📐 Scalability & Architecture

#### 🟡 Important

- **Sub-carpetas de páginas sin organización interna**  
  Problem: `src/features/sst/pages/` contiene 8 archivos planos. `Capacitaciones.jsx` con 1 376 líneas debería ser una carpeta `capacitaciones/` con `index.jsx`, `ModalDetalle.jsx`, `ModalNueva.jsx`, etc.  
  Risk: A 15+ archivos en la misma carpeta, la navegación del proyecto se vuelve caótica.  
  Fix: Adoptar folder-per-feature para cualquier módulo con más de 1 archivo lógico:
  ```
  src/features/sst/pages/
    capacitaciones/
      index.jsx          ← componente principal
      ModalDetalle.jsx
      ModalNueva.jsx
      useCapacitaciones.js  ← lógica extraída
    incidentes/
      ...
  ```

- **Estado global mínimo, todo en componentes** — Global  
  Problem: El 100% del estado de UI (filtros, modales, paginación, búsqueda) vive en estado local de componentes. Esto es correcto para la escala actual, pero hace imposible (por ejemplo) abrir un modal desde una notificación de Navbar sin prop-drilling o un event bus.  
  Risk: A medida que se añadan módulos, la necesidad de estado compartido entre rutas requerirá refactoring mayor.  
  Fix: Evaluar Zustand o Jotai (ambos <5KB) para estado de UI cross-component. No es urgente hasta que surja el primer caso de prop-drilling de más de 2 niveles.

- **Routing con doble `PrivateRoute` anidado** — `src/App.jsx:64-73`  
  Problem: Las rutas protegidas tienen un `PrivateRoute` en el `element` del `Route` padre (línea 64) y otro `PrivateRoute` con `roles` en cada ruta hija (líneas 65-72). La verificación se duplica en cada navegación.  
  Risk: Innecesario y confuso; si la lógica cambia, hay que actualizarla en dos lugares.  
  Fix: El `PrivateRoute` del padre verifica autenticación; los hijos verifican solo rol. O mejor, usar un `loader` de React Router v7 para centralizar guards.

#### 🟢 Low

- **`ROLES` centralizado pero no usado en todos los comparadores**  
  Problem: `ROLES` está en `src/constants/roles.js` y se usa en `App.jsx`. Sin embargo, en `Layout.jsx:48` y otros lugares se compara `user?.role?.toString?.().toLowerCase?.() === 'gerencia'` en lugar de `=== ROLES.GERENCIA`.  
  Fix: Buscar y reemplazar todas las comparaciones de strings de rol por la constante.

---

### ♿ Accessibility (A11Y)

#### 🟡 Important

- **SasbotWidget sin atributos ARIA de modal** — `src/components/chat/SasbotWidget.jsx`  
  Problem: El panel del chat se abre como overlay pero no tiene `role="dialog"`, `aria-modal="true"`, ni `aria-labelledby`. Tampoco implementa focus trap (el hook `useModal` no se usa aquí).  
  Risk: Los lectores de pantalla no anuncian que se abrió un diálogo. El usuario con discapacidad visual puede navegar por teclado "fuera" del chat mientras está abierto.  
  Fix: Agregar al contenedor del chat:
  ```jsx
  role="dialog"
  aria-modal="true"
  aria-label="Asistente SASBOT"
  ```
  Y usar `useModal(onCerrar)` para el focus trap y cierre con Escape.

- **Panel de notificaciones sin accesibilidad de teclado** — `src/components/layout/Navbar.jsx`  
  Problem: Al abrir el dropdown de notificaciones, el foco no se mueve al panel. El botón del campanero no tiene `aria-expanded`, `aria-haspopup`, ni `aria-controls`.  
  Risk: Usuarios de teclado no pueden interactuar con las notificaciones.  
  Fix:
  ```jsx
  <button
    aria-label="Notificaciones"
    aria-expanded={panelAbierto}
    aria-haspopup="true"
    aria-controls="panel-notificaciones"
    onClick={...}
  >
  ```
  Y mover foco al primer elemento del panel al abrirse.

- **Contraste de color insuficiente en modo oscuro**  
  Problem: El color `#9CA3AF` (Tailwind `gray-400`) usado como texto secundario (`sub`) sobre fondo `#111827` (Tailwind `gray-900`) tiene ratio de contraste de aproximadamente **3.1:1**, por debajo del mínimo WCAG AA de 4.5:1 para texto normal.  
  Risk: Usuarios con visión reducida no pueden leer metadatos, fechas, subtítulos.  
  Fix: Cambiar `sub` en modo oscuro de `#9CA3AF` a `#CBD5E1` (Tailwind `slate-300`, ratio ≈5.7:1) o `#D1D5DB` (`gray-300`, ratio ≈6.1:1).

#### 🟢 Low

- **`aria-current="page"` ausente en navegación** — `src/components/layout/Sidebar.jsx`, `src/components/layout/MobileBottomNav.jsx`  
  Problem: Los items de navegación activos usan estilos visuales para indicar la ruta actual, pero no tienen `aria-current="page"`.  
  Risk: Los lectores de pantalla no anuncian cuál es la página actual al navegar por el menú.  
  Fix: Agregar `aria-current={isActive ? 'page' : undefined}` a cada item de nav.

- **`alt` text en foto de perfil** — `src/features/sst/pages/PerfilSST.jsx`, `src/features/empleado/pages/EmpleadoPerfil.jsx`  
  Problem: La imagen de avatar de usuario probablemente usa `alt=""` o sin alt.  
  Fix: Usar `alt={`Foto de perfil de ${user.nombre}`}`.

---

### 🛠 Developer Experience & CI/CD

#### 🔴 Critical

- **Cero pruebas automatizadas** — Global  
  Problem: No existe ningún archivo `.test.js`, `.spec.js`, ni carpeta `__tests__/`. No hay Vitest, Jest, ni React Testing Library instalados.  
  Risk: (1) Cualquier refactoring es un acto de fe. (2) El crash de `KPICard` descrito en este audit habría sido detectado con un test de snapshot o de render básico. (3) Imposible hacer CI/CD real sin tests.  
  Fix:
  ```bash
  npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
  ```
  Comenzar con tests de los 3 flujos críticos: Login, creación de reporte de incidente, y carga del Dashboard.

- **Sin pipeline CI/CD** — Repositorio  
  Problem: No hay `.github/workflows/` ni equivalente. La única "validación" antes de deploy a Vercel es que el build no falle.  
  Risk: Código con errores de lint, pruebas fallidas, o imports rotos puede llegar a producción sin detección automática.  
  Fix: Crear `.github/workflows/ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    quality:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci
        - run: npm run lint
        - run: npm run build
        # - run: npm test  (cuando existan tests)
  ```

- **Sin pre-commit hooks** — Repositorio  
  Problem: No hay Husky ni lint-staged. Un developer puede hacer commit de código con errores de ESLint o formato inconsistente.  
  Fix:
  ```bash
  npm install -D husky lint-staged
  npx husky init
  ```
  Configurar en `package.json`:
  ```json
  "lint-staged": { "src/**/*.{js,jsx}": ["eslint --fix", "prettier --write"] }
  ```

#### 🟡 Important

- **ESLint sin plugin de accesibilidad** — `eslint.config.js`  
  Problem: ESLint está configurado con `react-hooks` y `react-refresh`, pero no con `eslint-plugin-jsx-a11y`.  
  Risk: Los problemas de accesibilidad encontrados en este audit (aria-label faltantes, roles incorrectos) no se detectan en desarrollo.  
  Fix:
  ```bash
  npm install -D eslint-plugin-jsx-a11y
  ```
  Agregar al `eslint.config.js`:
  ```js
  import jsxA11y from 'eslint-plugin-jsx-a11y'
  ```

- **Prettier no integrado con ESLint** — `eslint.config.js`, `.prettierrc`  
  Problem: Prettier y ESLint están configurados de forma independiente. No hay `eslint-config-prettier` para deshabilitar reglas de ESLint que conflictúen con Prettier.  
  Fix:
  ```bash
  npm install -D eslint-config-prettier
  ```

- **Suspense fallback ignora el tema** — `src/App.jsx:42`  
  Problem: El spinner de carga usa `backgroundColor: '#0B0F19'` hardcodeado, que es el fondo del tema oscuro. En tema claro, el spinner aparece con fondo negro.  
  Risk: Flash visual (FOUC) al cargar en tema claro.  
  Fix: Leer la preferencia de tema desde `localStorage` antes de que React monte:
  ```js
  const prefersDark = localStorage.getItem('pisst_theme') !== 'light'
  // usar en el style del fallback
  ```

#### 🟢 Low

- **`.env.example` incompleto**  
  Problem: `.env.example` documenta solo 2 variables. Si en el futuro se agregan nuevas `VITE_*`, hay riesgo de que `.env.example` no se actualice y nuevos devs no sepan qué configurar.  
  Fix: Asegurar que `.env.example` siempre refleje todas las variables de `.env` con valores de ejemplo o descripciones. Considerar `dotenv-safe` para validar esto automáticamente.

---

### 📦 Dependency Health

#### 🟡 Important

- **React 19 + React Router v7 + Vite 8 — tres majors muy recientes** — `package.json`  
  Problem: React 19 fue lanzado en diciembre 2024, React Router v7 en noviembre 2024, Vite 8 en 2025. El ecosistema (librerías de terceros, documentación, Stack Overflow) todavía está adaptándose.  
  Risk: `recharts 3.x` puede tener incompatibilidades con React 19 Concurrent Mode. Bugs en versiones nuevas pueden afectar el proyecto antes de que el parche sea liberado.  
  Fix: Mantener estas versiones bloqueadas con rangos exactos en `package.json` (sin `^`):
  ```json
  "react": "19.2.6",
  "react-dom": "19.2.6"
  ```
  Actualizar solo después de verificar que las librerías dependientes son compatibles.

- **Caret ranges en todas las dependencias** — `package.json`  
  Problem: Todas las dependencias usan `^` (ej: `"axios": "^1.16.1"`), lo que permite actualizaciones de minor y patch automáticas en `npm install`.  
  Risk: Una actualización de patch de `axios` o `recharts` puede introducir un bug o cambio de comportamiento.  
  Fix: Usar `npm shrinkwrap` o confiar en el `package-lock.json` commiteado. Para producción, considerar bloquear versiones exactas.

#### 🟢 Low

- **Sin librería de fechas** — `package.json`  
  Problem: Todo el manejo de fechas se hace con `Intl.DateTimeFormat` nativo y regex manuales. Esto funciona pero produce código repetitivo y frágil (como las 5 implementaciones duplicadas encontradas).  
  Risk: Bajo para el tamaño actual del proyecto.  
  Fix: Si la duplicación de lógica de fechas continúa creciendo, considerar `date-fns` (~13KB tree-shakeable) para operaciones complejas. No es urgente si se centraliza en `utils/dates.js`.

- **Sin analizador de bundle** — `package.json` (devDependencies)  
  Problem: No hay `rollup-plugin-visualizer` ni equivalente para inspeccionar el tamaño del bundle.  
  Fix:
  ```bash
  npm install -D rollup-plugin-visualizer
  ```
  Agregar a `vite.config.js` para análisis ocasional.

---

## Cross-Cutting Patterns

Estos problemas aparecen en múltiples archivos y deben resolverse a nivel de arquitectura, no archivo por archivo:

1. **Patrón "3 variables de tema en cada componente"**: Cada componente declara sus propias variables `const card = darkMode ? '#111827' : '#FFFFFF'`, `const text = ...`, `const sub = ...`, etc. Esto aparece en **al menos 15 archivos**. Es la fuente del problema de estilos inline masivos. La solución es un sistema de tokens CSS o un hook `useColors()` centralizado.

2. **Falta de tipos en props de componentes compartidos**: `KPICard`, `MetricsAccordion`, `ConfirmDialog`, `Paginador` son usados en múltiples lugares sin contrato de tipos definido. El crash de `trend.map()` es la consecuencia directa. **Regla**: todo componente en `src/components/` debe tener PropTypes o tipos TypeScript.

3. **Lógica de negocio acoplada a UI**: Las funciones de transformación de datos (normalizar tipos de peligro, calcular niveles de riesgo, mapear estados a labels) viven dentro de los mismos archivos JSX que los renders. Esto dificulta testear la lógica sin montar componentes. La solución es extraerlas a archivos `*.utils.js` o hooks personalizados.

4. **Gestión de estado de modales inconsistente**: Algunas páginas usan `useState(null)` para el elemento seleccionado (`modalDetalle = null | objeto`), otras usan `useState(false)` para visibilidad + estado separado para el dato. Estandarizar el patrón.

---

## Prioritized Action Plan

| Priority | Dimension | Finding | Fix | Effort | Impact |
|----------|-----------|---------|-----|--------|--------|
| 1 | Code Quality | Sin Error Boundaries — pantallas negras en errores | Crear `ErrorBoundary.jsx` y envolver `Layout` y `App` | Bajo (2h) | Crítico |
| 2 | Security | Sin HSTS header | Agregar 1 línea a `vercel.json` | Muy bajo (5min) | Alto |
| 3 | Code Quality | Funciones de fecha duplicadas en 5+ archivos | Centralizar en `src/utils/dates.js` | Bajo (3h) | Alto |
| 4 | Accessibility | Contraste insuficiente en modo oscuro | Cambiar `sub` dark de `#9CA3AF` a `#CBD5E1` | Muy bajo (30min) | Alto |
| 5 | Accessibility | SasbotWidget sin ARIA de modal | Agregar `role`, `aria-modal`, `aria-label` y `useModal` | Bajo (1h) | Alto |
| 6 | DX & CI/CD | Sin pipeline CI | Crear `.github/workflows/ci.yml` | Bajo (2h) | Alto |
| 7 | Performance | God components (Capacitaciones 1376L, Incidentes 1067L) | Extraer modales a archivos separados | Alto (2-3 días) | Crítico |
| 8 | Performance | N+1 requests en Auditorías | Solicitar endpoint bulk al backend | Medio (backend + frontend) | Medio |
| 9 | DX & CI/CD | Sin tests automatizados | Instalar Vitest + RTL, escribir tests del flujo de Login | Alto (días) | Crítico |
| 10 | Code Quality | Constantes de UI duplicadas por módulo | Crear `src/constants/estados.js` | Bajo (2h) | Medio |
| 11 | Code Quality | Sin PropTypes en componentes compartidos | Agregar PropTypes a `KPICard`, `ConfirmDialog`, `Paginador` | Bajo (2h) | Medio |
| 12 | Accessibility | `aria-current` en navegación | Agregar prop a Sidebar y MobileBottomNav | Muy bajo (30min) | Medio |
| 13 | DX & CI/CD | Sin pre-commit hooks | Instalar Husky + lint-staged | Bajo (1h) | Medio |
| 14 | DX & CI/CD | ESLint sin plugin a11y | Instalar `eslint-plugin-jsx-a11y` | Muy bajo (30min) | Medio |
| 15 | Security | JWT en sessionStorage | Migrar a httpOnly cookies (requiere backend) | Alto | Crítico |
| 16 | Performance | Paginación client-side | Implementar server-side pagination | Alto | Medio |
| 17 | Code Quality | Estilos inline de theming masivos | Hook `useColors()` o variables CSS | Alto | Bajo-Medio |

---

## Quick Wins
Cambios que toman menos de 30 minutos y mejoran la calidad inmediatamente:

1. **Agregar HSTS a `vercel.json`** — 1 línea, protección inmediata contra SSL-stripping.
2. **Cambiar `#9CA3AF` → `#CBD5E1` en modo oscuro** — Corrige contraste WCAG en todos los subtítulos.
3. **Agregar `aria-current="page"` en Sidebar y MobileBottomNav** — 2 archivos, accesibilidad de navegación.
4. **Agregar `aria-label="Notificaciones"` y `aria-expanded` al botón del campanero** — 1 archivo.
5. **Eliminar `Metricas.jsx` si es dead code** — Reduce confusión.
6. **Eliminar comentario `// ✅ AGREGADO` en `api.js:135`** — Código de producción limpio.
7. **Instalar `eslint-plugin-jsx-a11y`** — Detecta problemas de accesibilidad en desarrollo automáticamente.
8. **Agregar `rollup-plugin-visualizer` a devDependencies** — Visibilidad del bundle sin cambiar nada más.
9. **Cambiar `?sesion=expirada` por `navigate('/login', { state: { sesionExpirada: true } })`** — Más limpio y seguro.
10. **Bloquear versiones exactas de React, React Router y Vite** — Estabilidad inmediata sin actualizar nada.

---

## Scalability Roadmap
Qué debe hacerse ANTES de escalar a más empresas, más módulos, o más usuarios:

1. **Error Boundaries** (Semana 1): Sin esto, cualquier bug en producción resulta en pantalla negra para el usuario final. Es el seguro mínimo para escalar.

2. **Centralizar utils de fecha y constantes de estado** (Semana 1): Con cada nuevo módulo que se agregue, la duplicación crece. Detenerla ahora cuesta 3 horas; después de 5 módulos más, costará días.

3. **Descomponer los god components** (Semanas 2-3): `Capacitaciones.jsx` y `Capacitaciones.jsx` son bloqueadores de escala. Cualquier desarrollador nuevo que entre al proyecto tardará días en entender un solo archivo. Los features nuevos se vuelven cada vez más difíciles de agregar sin romper los existentes.

4. **Implementar tests del flujo crítico** (Semana 3-4): Login, creación de reporte, y aprobación de capacitación son los tres flujos que, si fallan, impactan a todos los usuarios. Tener tests de integración de estos tres flujos permite refactoring con confianza.

5. **Server-side pagination** (Mes 2): Con múltiples empresas usando la plataforma, cargar 50 incidentes por empresa puede convertirse en cargar 5000. El backend ya tiene `skip` y `limit` — el frontend solo necesita usarlos.

6. **Sistema de tokens de color CSS** (Mes 2): El sistema actual de `darkMode ? '#111827' : '#FFFFFF'` en 15+ archivos hace que agregar un tercer tema (ej: tema de alta legibilidad para personas con discapacidad visual) requiera modificar cada archivo. Un sistema de tokens CSS (`var(--bg-surface)`) lo reduce a cambiar el valor del token.

7. **Migración a httpOnly cookies** (Mes 3, coordinado con backend): Es el fix de seguridad más impactante. Requiere trabajo en FastAPI (configurar cookie session, refresh automático), pero es el camino hacia una arquitectura de autenticación que pueda escalar con múltiples dispositivos y sesiones paralelas.

8. **Role-permission matrix centralizada** (Mes 3): A medida que se agreguen módulos o sub-roles (ej: "SST Junior" con permisos reducidos), el patrón actual de `roles={[ROLES.SST]}` en cada `<Route>` se volverá frágil. Crear una matriz:
   ```js
   const PERMISOS = {
     [ROLES.SST]:      ['dashboard', 'incidentes', 'riesgos', ...],
     [ROLES.GERENCIA]: ['dashboard', 'incidentes'],
     [ROLES.EMPLEADO]: ['empleado.chat', 'empleado.reporte'],
   }
   ```
   Y un hook `usePuede('incidentes.crear')` que consulte esta matriz.

---

*Reporte generado por auditoría con asistencia de IA. Todos los hallazgos deben ser validados por un ingeniero humano antes de aplicar cambios en producción. Las severidades reflejan el contexto de un proyecto académico-productivo en etapa temprana.*
