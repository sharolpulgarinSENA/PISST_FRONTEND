import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function CambiarPassword() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ password_actual: "", nueva_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.cambiarPassword(form);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(
        msg === "password_actual_incorrecto"
          ? "La contraseña actual es incorrecta."
          : "Error al cambiar la contraseña. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380, padding: "2rem", border: "1px solid var(--color-border-tertiary)", borderRadius: 12 }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Cambia tu contraseña</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem", fontSize: 14 }}>
          Por seguridad debes establecer una nueva contraseña antes de continuar.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Contraseña actual</span>
            <input
              type="password"
              required
              style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem 0.75rem", borderRadius: 8,
                       border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)" }}
              value={form.password_actual}
              onChange={(e) => setForm({ ...form, password_actual: e.target.value })}
            />
          </label>
          <label style={{ display: "block", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Nueva contraseña</span>
            <input
              type="password"
              required
              minLength={8}
              style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem 0.75rem", borderRadius: 8,
                       border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)" }}
              value={form.nueva_password}
              onChange={(e) => setForm({ ...form, nueva_password: e.target.value })}
            />
          </label>
          {error && (
            <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: "1rem" }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "none",
                     background: "var(--color-text-info)", color: "#fff", cursor: "pointer", fontWeight: 500 }}
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}