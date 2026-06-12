# PROMPT — Reportes creados por Gerencia: notificación + (opcional) id del creador

Hola Barner, gracias por agregar `creado_por_nombre` y `creado_por_rol` a
`IncidenteResponse` (lista y detalle) — con eso el frontend ya muestra
correctamente "Reportado por: {nombre} · {rol}" en el detalle del reporte, y
también lo usamos como fallback (comparando `creado_por_nombre` con el nombre
del usuario logueado) para armar la sección "Mis reportes" de Gerencia.

Queda pendiente un punto de la lista anterior:

## Notificación `reporte_nuevo` cuando el creador es Gerencia

Hoy, cuando cualquier usuario crea un reporte, el evento `reporte_nuevo` en
`GET /notificaciones/feed` siempre dice algo como "Un empleado reportó un
nuevo incidente...", sin importar el rol real de quien lo creó.

El frontend **no puede corregir esto por su cuenta**: solo muestra tal cual
los campos `titulo`/`descripcion` que ya vienen armados desde el backend. El
condicional tiene que vivir donde se genera ese texto, es decir, en el
backend, al momento de crear la notificación dentro de `POST /incidentes/`.

Como ya tienes `creado_por_rol` disponible (gracias al joinedload que
agregaste para `IncidenteResponse`), sería algo tan simple como:

```python
rol_texto = "Gerencia" if creado_por_rol == "gerencia" else "un empleado"
titulo = f"Nuevo reporte de {rol_texto}"
# o en la descripción:
descripcion = f"{rol_texto.capitalize()} reportó un nuevo {tipo}: {lugar}"
```

(Para reportes creados por SST también aplicaría el mismo condicional, por
si un encargado de SST llega a crear un reporte).

## Opcional (mejora futura, no bloquea nada ahora)

Si en algún momento agregas `creado_por_id` a `IncidenteResponse` (lista y
detalle), el frontend puede dejar de depender del fallback por nombre para
"Mis reportes" y filtrar de forma más robusta por id. No es urgente — el
fallback por nombre ya funciona.

Gracias.

---

## ✅ Confirmación (Sharon)

Los tres puntos quedaron resueltos del lado del backend y el frontend ya está
acondicionado para ellos:

1. **Notificación `reporte_nuevo` con rol real** — el frontend solo muestra
   `ev.titulo`/`ev.descripcion` tal cual, así que el nuevo texto
   ("Nuevo reporte de Gerencia", etc.) ya se ve automáticamente.
2. **`creado_por_id`** — el filtro de "Mis reportes" en `Incidentes.jsx` ya
   prefería `creado_por_id` cuando estuviera disponible; ahora que el backend
   lo envía siempre, ese es el camino que se usa. Se deja el fallback por
   nombre solo para reportes antiguos que no tengan `creado_por_id`.
3. **Bug de `POST /incidentes/` con `creado_por_nombre`/`creado_por_rol` en
   null** — no requería cambios en frontend, ya que no dependíamos de esos
   campos en la respuesta del POST.

No queda nada pendiente de este lado. ¡Gracias por el trabajo!
