export default function Mantenimiento() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <h2>Sistema en mantenimiento</h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Estamos realizando tareas de mantenimiento. Vuelve en unos minutos.
      </p>
      <button onClick={() => window.location.reload()}
        style={{ padding: "0.5rem 1.5rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)",
                 cursor: "pointer", background: "transparent" }}>
        Reintentar
      </button>
    </div>
  );
}