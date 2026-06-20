// Gradiente de fondo corporativo, compartido entre todos los layouts (empleado, SST, gerencia).
// Mismos tonos en los tres roles para mantener consistencia visual.
export function getAppGradient(darkMode, baseColor) {
  return darkMode
    ? `radial-gradient(circle at 20% 10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(circle at 85% 85%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(circle at 50% 50%, rgba(79,70,229,0.08), transparent 70%), ${baseColor}`
    : `radial-gradient(circle at 20% 10%, rgba(167,139,250,0.28), transparent 60%), radial-gradient(circle at 85% 85%, rgba(244,114,182,0.22), transparent 60%), radial-gradient(circle at 50% 50%, rgba(129,140,248,0.1), transparent 70%), ${baseColor}`
}
