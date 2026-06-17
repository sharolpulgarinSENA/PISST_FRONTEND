# AUDITORÍA UX/UI — PISST Frontend
> Fecha: junio 2026 · Stack: React 19 + Vite + Tailwind · Auditor: análisis estático completo del código fuente

---

## Resumen Ejecutivo

PISST es una aplicación SPA de gestión SG-SST con tres perfiles (SST, Gerencia, Empleado). La base visual es **sólida y consistente**: paleta indigo/dark unificada, modales con focus trap, skeleton loading, badges de estado, paginación responsiva. Sin embargo, se detectaron **11 hallazgos de alta prioridad** agrupados en tres categorías: visualización de datos engañosa, navegación en móvil sin etiquetas, y ausencia de búsqueda de contenido. Los módulos empleado (Reporte, Capacitaciones) son los más débiles en retroalimentación al usuario. El flujo de Riesgos tiene un problema de pestaña inicial que genera confusión inmediata.

**Cobertura del análisis:** Login · Dashboard · Incidentes · Riesgos · Auditorías · Capacitaciones · Usuarios · Empleado Reporte · Empleado Capacitaciones · SASBOT · Navegación Global (Layout, Sidebar, Navbar, MobileBottomNav)

---

## Hallazgos por Módulo

---

### 1. Login

#### 🟡 Importante

**L-01 · Botones SSO deshabilitados sin explicación visible**
Los botones de Google y Microsoft tienen un tooltip `"Próximamente disponible"` (solo en hover) pero no hay texto en pantalla ni estado visual que indique claramente que están desactivados. En pantallas táctiles el tooltip no aparece. Un usuario en móvil los intentará presionar sin feedback.
- **Afecta:** usuarios nuevos, todos los dispositivos
- **Fix:** añadir texto pequeño debajo del bloque ("Próximamente disponible") o usar `opacity-40` + etiqueta "Próximamente" visible directamente sobre los botones.

**L-02 · El switch de idioma no está renderizado**
Existe una variable de estado `lang` (es/en), un objeto de traducciones `T[lang]` y persistencia en `localStorage`, pero no hay ningún elemento UI para cambiarla. El código de internacionalización es funcional pero completamente inaccesible para el usuario. Es código muerto visible solo en el bundle.
- **Fix:** eliminar el código i18n (reduce complejidad) o añadir el botón de toggle que claramente falta.

#### 🟢 Mejora

**L-03 · reCAPTCHA puede desbordarse en pantallas < 340 px**
El widget de Google reCAPTCHA v2 tiene un ancho fijo de ~300 px. En dispositivos muy pequeños (Galaxy Fold cerrado, iPhone SE 1ra gen) el widget puede hacer scroll horizontal. No hay wrapper con `overflow: hidden` ni escala CSS.

**L-04 · Panel hero decorativo no aporta valor en desktop**
El panel izquierdo (45% del ancho en desktop) contiene solo logo, tagline y fondo decorativo. Es una oportunidad perdida para comunicar propuesta de valor del SG-SST, capturas de pantalla o métricas clave del sistema.

---

### 2. Dashboard

#### 🔴 Crítico

**D-01 · Líneas de tendencia (sparklines) son datos falsos**
Las tarjetas KPI generan su tendencia con `Array(7).fill(valor)` — una línea completamente plana al valor actual. El usuario ve una "tendencia" que no refleja cambio temporal real; es un gráfico decorativo que parece datos. Esto puede llevar a decisiones erróneas en contexto de seguridad laboral.
- **Afecta:** gerencia, SST
- **Fix (corto):** ocultar el componente sparkline hasta tener datos históricos reales. Fix largo: exponer datos de serie temporal en el endpoint `/metricas/kpis`.

#### 🟡 Importante

**D-02 · Score SG-SST aparece dos veces**
El Score SG-SST está en la tarjeta grande destacada Y dentro del array de KPIs compactos (`complianceMetrics`). El usuario ve el mismo dato en dos lugares con distinta escala visual.
- **Fix:** eliminar Score SG-SST del array de KPIs compactos o separar semánticamente ambos bloques.

**D-03 · Selector de período limitado a tres opciones predefinidas**
El selector mes/trimestre/año no permite rangos personalizados. Para auditorías de cumplimiento que cubren períodos no estándar (ej. enero–septiembre del año contractual), el dashboard no sirve.
- **Fix sugerido:** añadir opción "Personalizado" con date-range picker.

#### 🟢 Mejora

**D-04 · Densidad alta para usuario gerencia**
El layout apila: período selector → KPIs (4 cards) → Score SG-SST → MetricsAccordion → AnalyticsSummary → OverviewChart → ReportDocumentation. Para un ejecutivo, las secciones inferiores (documentación de reportes) son técnicas. Considerar un layout dual: vista ejecutiva vs. vista técnica SST.

---

### 3. Incidentes / Reportes

#### 🟡 Importante

**I-01 · No hay búsqueda de texto en la lista de incidentes**
La vista solo ofrece filtros por estado (botones). Sin búsqueda por texto libre, encontrar un incidente específico (por nombre del empleado, lugar, fecha) requiere paginar manualmente. Con 50+ incidentes esto es inviable.
- **Fix:** añadir `<input>` de búsqueda que filtre sobre el array local por `descripcion`, `lugar`, `tipo`.

**I-02 · Inconsistencia de capitalización en tipos de reporte**
En `Incidentes.jsx` (TIPO_LABEL): `cuasi_accidente: 'Cuasi Accidente'`. En `EmpleadoReporte.jsx` (TIPOS): `cuasi_accidente: 'Cuasi accidente'`. El mismo concepto aparece con diferente capitalización según el rol que lo ve. Menor pero visible en reportes generados.

**I-03 · Acciones correctivas sin botón eliminar**
El formulario de acciones correctivas tiene Pencil (editar) pero no Trash2 (eliminar). Una acción creada por error no puede borrarse.

#### 🟢 Mejora

**I-04 · Botón FURAT poco prominente**
El botón de descarga FURAT es `outline` (borde índigo, fondo transparente) en lugar de filled. Para un documento de reporte de accidente legalmente obligatorio (Formulario Único de Reporte de AT), debería tener mayor jerarquía visual.

**I-05 · Botón Pencil en acciones es icon-only sin aria-label en móvil**
El ícono Pencil tiene `title="Editar acción"` (tooltip de hover) pero no `aria-label`. En móvil con screen reader el botón no es anunciado correctamente.

---

### 4. Riesgos

#### 🔴 Crítico

**R-01 · Modal de detalle abre en pestaña "Evaluación" en lugar de "Información"**
Al hacer click en una tarjeta de peligro, el modal abre por defecto en `tab: 'evaluacion'` (el formulario de probabilidad/severidad). El usuario espera ver el resumen del peligro primero. La pestaña activa inicial debería ser `'info'`.
- **Fix:** cambiar el estado inicial `const [tab, setTab] = useState('evaluacion')` → `'info'` en `ModalDetalle` de Riesgos.

#### 🟡 Importante

**R-02 · No existe opción de eliminar un peligro**
Un peligro creado con datos incorrectos no puede eliminarse. Solo se puede crear y evaluar. Esto genera "deuda de datos" en la matriz de riesgos. Si el backend no soporta DELETE `/riesgos/peligros/{id}`, debe añadirse a BACKEND_PENDIENTE.md.

**R-03 · La matriz de riesgos (vista grid) no es usable en móvil**
La vista de matriz es una tabla 2D que requiere ancho horizontal. No hay adaptación para móvil (scroll horizontal o vista alternativa). En pantallas < 640px la matriz se trunca.

#### 🟢 Mejora

**R-04 · Sliders de probabilidad/severidad sin referencia de escala**
Los sliders van de 1 a 5 pero no muestran qué significa cada valor (ej. 1 = "Casi imposible", 5 = "Frecuente") inline. El usuario tiene que conocer la metodología de antemano.

---

### 5. Auditorías

#### 🟡 Importante

**A-01 · Progreso de NC solo visible dentro del modal**
Las tarjetas de auditoría en la lista muestran el badge de `nc_abiertas` pero no el porcentaje de cierre (ej. "3/5 NC cerradas"). El usuario debe abrir el modal para saber si está cerca de completar. Una barra de progreso inline en la tarjeta mejoraría la vista rápida.

**A-02 · Hallazgos y NCs anidados en un modal ya complejo**
El modal de detalle tiene: estado stepper + hallazgos (cada uno con clasificación + NCs anidadas + formulario inline). La profundidad de la interfaz (modal → hallazgo → NC inline) puede desorientar al usuario. Hay riesgo de perder el hilo de qué está editando.

#### 🟢 Mejora

**A-03 · Sin filtro o búsqueda en lista de auditorías**
Solo paginación. No hay filtro por estado (`planificada`, `en_ejecucion`, `completada`). Con múltiples auditorías activas, es difícil ver cuáles están en ejecución.

---

### 6. Capacitaciones

#### 🟡 Importante

**C-01 · Constructor de evaluación complejo para el perfil de usuario**
El SST coordinator crea capacitaciones con sesiones y evaluaciones que incluyen preguntas de opción múltiple (A/B/C/D) con una opción correcta. Todo dentro de un modal con tres "vistas" anidadas. Para coordinadores SST sin experiencia en plataformas educativas, esta interfaz es técnicamente desafiante. Considerar un wizard de pasos visible.

**C-02 · No se muestra zona horaria al crear sesión**
El campo `datetime-local` no indica que la hora se interpretará como Colombia (UTC-5). Si el sistema se usa desde otra zona horaria (o en un device con tz diferente), la sesión quedaría mal programada sin que el usuario lo note.
- **Fix:** añadir texto de apoyo "Hora Colombia (UTC-5)" junto al input.

**C-03 · Cambio de vista dentro del modal no usa tabs**
La navegación entre vista principal, asistencia y evaluación hace un re-render completo del modal (no tabs). Esto reinicia el scroll y el foco, lo que puede confundir al usuario si estaba editando campos antes de navegar.

#### 🟢 Mejora

**C-04 · Sin confirmación al suspender una capacitación activa**
El botón "Suspender" cambia el estado directamente sin diálogo de confirmación (`ConfirmDialog`). Suspender es destructivo para los empleados asignados que aún no tomaron la capacitación.

---

### 7. Usuarios

#### 🟡 Importante

**U-01 · Áreas y cargos no tienen edición ni eliminación**
`ModalGestionarOrg` tiene tabs de Áreas y Cargos con `GET + POST` únicamente. Un área o cargo con typo o nombre erróneo permanece en el sistema para siempre y aparece en selectores de toda la app.
- **Fix mínimo:** añadir PATCH y DELETE en el backend (`/areas/{id}`, `/cargos/{id}`) y los botones inline de edición en el modal.

**U-02 · Selector nativo `<select>` inconsistente con el sistema de diseño**
`SelectDB` usa un `<select>` HTML nativo que hereda estilos del sistema operativo, diferente al estilo custom de los otros filtros (checkbox, botones de filtro). En dark mode el select nativo puede no adaptarse correctamente al tema oscuro en algunos browsers.

#### 🟢 Mejora

**U-03 · No hay búsqueda en la lista de usuarios**
Con 50+ empleados, el SST coordinator debe paginar para encontrar a alguien. El endpoint acepta `skip/limit` pero no `q` (texto). Añadir búsqueda local sobre el array cargado sería inmediato mientras se implementa search en el backend.

---

### 8. Empleado — Reporte (EmpleadoReporte)

#### 🟡 Importante

**ER-01 · Visibilidad nula del seguimiento post-envío**
Después de enviar un reporte, el empleado solo ve el badge de estado en la lista ("en_revision", "abierto", etc.) con el texto: "El encargado de SST gestiona el seguimiento de este reporte." No hay información sobre qué pasos siguen, tiempos estimados, ni quién lo gestiona. En contexto laboral, el empleado puede sentir que su reporte desapareció.
- **Fix:** mostrar en el detalle del reporte (modo readOnly) el historial de cambios de estado o una línea de tiempo básica.

**ER-02 · `normFecha` redefinida localmente**
El archivo define su propia `normFecha` (líneas 21-24) en lugar de importar `normFecha` de `../../../utils/dates`. Esto es código duplicado que puede divergir con el tiempo.
- **Fix:** reemplazar la definición local por `import { normFecha } from '../../../utils/dates'`.

#### 🟢 Mejora

**ER-03 · Selector de partes del cuerpo es texto, no visual**
El selector de partes del cuerpo afectadas es un `<select>` agrupado (PARTES_CUERPO_GRUPOS). Una representación visual (silueta clicable) mejoraría significativamente la usabilidad, especialmente para empleados con bajo nivel de lectura.

---

### 9. Empleado — Capacitaciones (EmpleadoCapacitaciones)

#### 🟡 Importante

**EC-01 · La vista de evaluación reemplaza la vista principal sin breadcrumb ni retroceso claro**
Al iniciar una evaluación, la UI cambia a modo `evaluacion` que ocupa toda la pantalla. No hay breadcrumb ni botón "Volver" inmediatamente visible (aparece al final del formulario). El empleado puede sentirse atrapado sin poder salir fácilmente.

**EC-02 · Estado vacío sin llamada a la acción**
Cuando un empleado no tiene capacitaciones asignadas, se muestra "Aún no tienes capacitaciones asignadas." sin ninguna orientación (¿a quién contactar?, ¿qué debe pasar primero?). Mejoraría con: "Contacta a tu coordinador SST para que te asigne capacitaciones."

#### 🟢 Mejora

**EC-03 · Formato dual de opciones de evaluación**
El código gestiona opciones de pregunta con `op?.clave ?? op` y `op?.texto ?? op`, manejando dos formatos posibles del backend. Esto es frágil y puede mostrar datos crudos al usuario si el backend cambia su estructura.

---

### 10. SASBOT (Chat)

#### 🟡 Importante

**S-01 · Paginación de historial en dirección contraria a la lectura**
El botón "Ver mensajes anteriores" carga mensajes más antiguos al tope del chat, empujando hacia abajo los mensajes actuales. El usuario pierde su posición de lectura. Lo estándar en chats es preservar el scroll o hacer scroll automático a la posición anterior después de cargar.

**S-02 · No hay feedback inmediato al subir un archivo de tipo inválido**
El input de archivo acepta `image/*,application/pdf`. Si el usuario selecciona un tipo no soportado, el rechazo ocurre en el servidor (backend valida magic bytes). No hay validación client-side que muestre el error antes del upload.
- **Fix:** añadir `accept="image/*,application/pdf"` + validar el `file.type` antes de llamar `chatAPI.enviarArchivo`.

#### 🟢 Mejora

**S-03 · Modo emergencia no visible al primer abrir**
El botón de "modo emergencia" (escalamiento) está disponible en el widget pero su prominencia es baja. Para una app de seguridad laboral donde reportar una emergencia puede ser crítico, este flujo debería estar más visible o tener un acceso directo desde la barra inferior móvil.

---

### 11. Navegación Global

#### 🔴 Crítico

**N-01 · MobileBottomNav sin etiquetas de texto en móviles pequeños**
La barra inferior muestra 6 ítems (SST) u 3 ítems (Gerencia) con `<span className="hidden md:block">` — en breakpoint menor a `md` (< 768px) los íconos no tienen texto. Íconos como `ShieldCheck` (Evaluación de Riesgos) o `ClipboardList` (Auditorías) son ambiguos sin etiqueta. Esto afecta a cualquier usuario con teléfono moderno (la mayoría).
- **Fix inmediato:** cambiar a `hidden sm:block` (ocultar solo < 640 px) o reducir el número de íconos para que quepan con etiquetas.
- **Fix ideal:** limitar la barra a 5 ítems con texto visible (estándar de usabilidad de bottom nav).

#### 🟡 Importante

**N-02 · `id: 'mas'` en MobileBottomNav SST (naming residual)**
El ítem "Usuarios" tiene `id: 'mas'` (vestigio de un botón "Más..."). Cuando el Layout hace `routeToNavSST['/usuarios']` devuelve `undefined` (la clave en el objeto es solo para `/incidentes`, `/riesgos`, etc., pero no `/usuarios`). Al estar en `/usuarios`, el active nav es el fallback `'dashboard'`, activando incorrectamente el ícono de Dashboard en la barra inferior.
- **Fix:** añadir `'/usuarios': 'mas'` a `routeToNavSST` en `Layout.jsx`.

**N-03 · Búsqueda global navega a secciones, no busca contenido**
La barra de búsqueda en Navbar es una navegación por palabras clave (lleva a `/incidentes`, `/riesgos`, etc.). No busca contenido real (incidentes, nombres, fechas). Si un coordinador busca "Carlos Pérez" esperaría ver los incidentes de esa persona, no ser redirigido a la página de incidentes.
- **Sugerencia:** renombrar visualmente ("Ir a…") o implementar búsqueda federada en futuras versiones.

**N-04 · Acciones rápidas del Navbar duplican la Sidebar**
El centro del Navbar (solo desktop) muestra botones: "Nuevo reporte", "Capacitaciones", "Evaluación de Riesgos", "Auditorías". Estos son los mismos destinos que la Sidebar adyacente. Aumenta el ruido visual sin añadir valor navegacional único. Solo "Nuevo reporte" (con `?nuevo=true`) es diferente al Sidebar.
- **Fix:** mantener solo "Nuevo reporte" como acción rápida; eliminar los links que duplican la Sidebar.

**N-05 · `normFecha` definida localmente en Navbar.jsx**
`Navbar.jsx` líneas 51-54 definen `normFecha` localmente, no importada de `utils/dates`. El cleanup de la auditoría previa no alcanzó este archivo.
- **Fix:** `import { normFecha } from '../../utils/dates'` y eliminar la definición local.

#### 🟢 Mejora

**N-06 · Sin scroll-to-top en cambio de ruta**
Al navegar entre módulos, la página no vuelve al tope automáticamente. Si el usuario estaba al fondo de Incidentes y navega a Auditorías, comienza con el scroll al fondo.
- **Fix:** añadir `<ScrollRestoration />` de `react-router-dom` en el Layout o un `useEffect` que llame `window.scrollTo(0, 0)` en cambio de `location.pathname`.

---

## Patrones Repetidos (Cross-cutting)

### P-1 · Paleta de colores inline en cada componente (mantenimiento)
Cada página y modal redefine las mismas ~7 variables de color (`bg`, `card`, `border`, `text`, `sub`, `input`) desde `darkMode`. Existen en 15+ archivos con los mismos valores hex. Esto no es un bug visual, pero significa que cambiar un color del tema requiere editar 15 archivos. Refactorizar a CSS custom properties o un módulo `useColors()` centralizado cuando la base de código estabilice.

### P-2 · Ausencia universal de búsqueda por contenido
Ningún módulo (Incidentes, Riesgos, Auditorías, Usuarios, Capacitaciones) tiene búsqueda por texto libre dentro de la lista. El Navbar solo navega entre secciones. En un SG-SST con historia de 2+ años esto se vuelve crítico.

### P-3 · Botones de acción icon-only sin aria-label en varios módulos
Pencil/Trash2 en acciones de Incidentes, controles de Riesgos, y áreas/cargos de Usuarios no tienen `aria-label`. Impactan lectores de pantalla y usuarios con baja literacidad visual.

### P-4 · Modales con scroll interno + formularios anidados
Varios modales (Capacitaciones, Auditorías, Incidentes) tienen subformularios que aparecen dentro de un modal ya en scroll. La jerarquía visual se aplana y es difícil que el usuario sepa qué está editando en qué contexto.

### P-5 · Sin confirmación en acciones destructivas de algunos módulos
`ConfirmDialog` existe y se usa en Usuarios y en la acción de cerrar sesión. Pero `Suspender capacitación` y `Cambiar estado de incidente a borrador` (regresión) no tienen diálogo de confirmación.

---

## Tabla de Recomendaciones Prioritarias

| # | Módulo | Hallazgo | Impacto | Esfuerzo | Prioridad |
|---|--------|----------|---------|----------|-----------|
| 1 | Nav Global | N-01: Etiquetas en MobileBottomNav ocultas en móvil | Alto | Bajo | 🔴 P1 |
| 2 | Dashboard | D-01: Sparklines con datos falsos (Array.fill) | Alto | Bajo | 🔴 P1 |
| 3 | Riesgos | R-01: Modal abre en pestaña "Evaluación" en vez de "Info" | Alto | Muy bajo | 🔴 P1 |
| 4 | Nav Global | N-02: `id: 'mas'` causa active incorrecto en `/usuarios` | Medio | Muy bajo | 🔴 P1 |
| 5 | Incidentes | I-01: Sin búsqueda de texto en lista | Alto | Bajo | 🟡 P2 |
| 6 | Login | L-02: Switch de idioma no renderizado (código muerto) | Bajo | Bajo | 🟡 P2 |
| 7 | Login | L-01: SSO deshabilitado sin texto explicativo visible | Medio | Muy bajo | 🟡 P2 |
| 8 | Nav Global | N-04: Acciones rápidas Navbar duplican Sidebar | Bajo | Muy bajo | 🟡 P2 |
| 9 | Empleado Reporte | ER-02: `normFecha` local duplicada | Bajo | Muy bajo | 🟡 P2 |
| 10 | Nav Global | N-05: `normFecha` local en Navbar.jsx | Bajo | Muy bajo | 🟡 P2 |
| 11 | Usuarios | U-01: Sin edición/eliminación de áreas y cargos | Alto | Medio (requiere backend) | 🟡 P2 |
| 12 | Empleado Cap | EC-01: Evaluación sin botón retroceso visible | Medio | Bajo | 🟡 P2 |
| 13 | SASBOT | S-01: Paginación de historial invierte el scroll | Medio | Medio | 🟡 P2 |
| 14 | SASBOT | S-02: Sin validación client-side de tipo de archivo | Bajo | Muy bajo | 🟡 P2 |
| 15 | Capacitaciones | C-02: Sin indicación de zona horaria en sesiones | Medio | Muy bajo | 🟡 P2 |
| 16 | Incidentes | I-03: Acciones correctivas sin eliminar | Medio | Bajo | 🟡 P2 |
| 17 | Riesgos | R-02: Sin eliminar peligros | Medio | Bajo (requiere backend) | 🟡 P2 |
| 18 | Dashboard | D-02: Score SG-SST duplicado | Bajo | Muy bajo | 🟢 P3 |
| 19 | Nav Global | N-03: Búsqueda global es navegación, no contenido | Medio | Alto | 🟢 P3 |
| 20 | Nav Global | N-06: Sin scroll-to-top en navegación | Bajo | Muy bajo | 🟢 P3 |
| 21 | Auditorías | A-01: Progreso NC no visible en lista | Bajo | Bajo | 🟢 P3 |
| 22 | Usuarios | U-03: Sin búsqueda en lista de usuarios | Medio | Bajo | 🟢 P3 |
| 23 | Empleado Reporte | ER-01: Sin historial de estado en reporte empleado | Medio | Medio (requiere backend) | 🟢 P3 |
| 24 | Capacitaciones | C-04: Sin confirmación al suspender capacitación | Bajo | Muy bajo | 🟢 P3 |
| 25 | Riesgos | R-04: Sliders sin escala descriptiva | Bajo | Bajo | 🟢 P3 |

---

## Quick Wins (< 2 horas cada uno)

Los siguientes cambios son mecánicos, de bajo riesgo y alto impacto inmediato:

1. **[N-01]** `MobileBottomNav.jsx`: cambiar `hidden md:block` → `hidden sm:block` en las etiquetas. O reducir a 5 ítems (mover Usuarios al Sidebar solo).

2. **[R-01]** `Riesgos.jsx` — `ModalDetalle`: cambiar `useState('evaluacion')` → `useState('info')` en la pestaña inicial.

3. **[N-02]** `Layout.jsx`: añadir `'/usuarios': 'mas'` en el objeto `routeToNavSST`.

4. **[D-01]** `Dashboard.jsx`: buscar el array con `Array(7).fill(...)` en los sparklines y reemplazarlo por `null` / no renderizar el mini-chart hasta tener datos reales.

5. **[L-01]** `Login.jsx`: añadir `<p className="text-xs text-center mt-2 text-gray-400">Próximamente disponible</p>` bajo los botones de SSO deshabilitados.

6. **[N-04]** `Navbar.jsx`: en el bloque de acciones rápidas SST, mantener solo `{ label: 'Nuevo reporte', path: '/incidentes?nuevo=true' }` y eliminar los otros tres que duplican el Sidebar.

7. **[N-05] + [ER-02]** `Navbar.jsx` y `EmpleadoReporte.jsx`: eliminar las definiciones locales de `normFecha` e importar de `../../utils/dates` / `../../../utils/dates`.

8. **[S-02]** `SasbotWidget.jsx`: añadir validación de `file.type` antes de subir (`/^image\//` o `application/pdf`) con mensaje inline si falla.

9. **[C-02]** `Capacitaciones.jsx`: añadir `<span className="text-xs text-gray-500 mt-1">Hora Colombia (UTC-5)</span>` junto al input de fecha/hora de sesión.

10. **[N-06]** `Layout.jsx`: añadir `<ScrollRestoration />` de `react-router-dom` dentro del JSX del Layout (o un hook `useEffect` con `window.scrollTo(0,0)` en `location.pathname`).

11. **[C-04]** `Capacitaciones.jsx`: envolver la llamada a `suspender(id)` en un `ConfirmDialog` similar al ya implementado para otras acciones destructivas.

12. **[I-02]** `EmpleadoReporte.jsx`: corregir capitalización `'Cuasi accidente'` → `'Cuasi Accidente'` para coincidir con el TIPO_LABEL de `Incidentes.jsx`.

---

*Fin de auditoría — PISST Frontend · junio 2026*
