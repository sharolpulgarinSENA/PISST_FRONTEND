# PROMPT — Backend para el módulo "Mis Capacitaciones" del rol Empleado

Hola Barner, integramos la sección de capacitaciones para el rol `empleado`
("Mis Capacitaciones") y necesitamos confirmar/ajustar lo siguiente del lado
del backend.

## 1. `GET /capacitaciones/empleados/{empleado_id}/historial`

El frontend llama a este endpoint (`capacitacionesAPI.getHistorialEmpleado`)
para listar **todas** las capacitaciones asignadas al empleado, no solo las
que ya tienen asistencia registrada. Cada fila debería incluir, idealmente:

- `capacitacion_nombre`
- `fecha_sesion` (fecha de la sesión, en UTC)
- `estado` (o `sesion_estado`): uno de `programada`, `realizada`,
  `no_realizada`, `cancelada` — el mismo enum que ya usa
  `features/sst/pages/Capacitaciones.jsx` para las sesiones. Si una sesión
  está programada a futuro, `estado` puede venir vacío/`programada` y el
  frontend la pinta como "Programada"; si la fecha ya pasó y no hay `estado`,
  el frontend la muestra como "Pendiente" (de información, sin acción posible
  para el empleado).
- `evaluacion_id` y objeto `evaluacion` embebido (preguntas, puntaje mínimo),
  si la capacitación tiene evaluación asociada.
- `resultado` (puntaje, aprobado, respuestas correctas/totales) una vez que
  el empleado respondió la evaluación.

Si hoy el endpoint solo devuelve las filas con asistencia/evaluación, por
favor confirmar si se puede ampliar para incluir también las sesiones
`programada`/`cancelada` sin asistencia, para que el empleado vea el panorama
completo de sus capacitaciones (sin poder modificarlas, solo consulta).

## 2. Chat / SASBOT para rol `empleado`

`EmpleadoChat.jsx` ahora usa:
- `chatAPI.enviarArchivo(formData)` → `POST /chat/archivo`
- `chatAPI.escalar()` → `POST /chat/escalar`

Estos ya funcionan para `sst`/`gerencia` desde `SasbotWidget.jsx`. ¿Podrían
confirmar que ambos endpoints están habilitados también para usuarios con
rol `empleado`?

## 3. Perfil del empleado

`EmpleadoPerfil.jsx` ahora usa los mismos endpoints que `PerfilSST.jsx`:
- `PUT /usuarios/me/foto` (subir foto de perfil)
- `PATCH /usuarios/me` (editar nombre/teléfono)
- `POST /auth/cambiar-password` (cambio de contraseña)

¿Podrían confirmar que estos tres también están habilitados para el rol
`empleado`? (antes el frontend de empleado llamaba a rutas distintas —
`/auth/change-password` y `POST /usuarios/me/foto` — que no existen en el
backend actual, por eso la foto de perfil no se podía subir).

Gracias.
