import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, X, Lock, ShieldCheck } from "lucide-react";
import { authAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/* ══════════════════════════════════════════
   Estándares de contraseña (deben coincidir
   con validar_fortaleza_password del backend):
   - mínimo 8 caracteres
   - al menos una mayúscula
   - al menos un símbolo
══════════════════════════════════════════ */
const REQUISITOS = [
  { id: "longitud",  label: "Mínimo 8 caracteres",     test: (p) => p.length >= 8 },
  { id: "mayuscula", label: "Al menos una mayúscula",  test: (p) => /[A-Z]/.test(p) },
  { id: "simbolo",   label: "Al menos un símbolo (!@#$%…)", test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=/[\]\\;'`~]/.test(p) },
];

/* ══════════════════════════════════════════
   Extrae el mensaje de error del backend.
   El backend devuelve detail como string, pero
   manejamos también el array de Pydantic por si
   algún endpoint cambia a futuro.
══════════════════════════════════════════ */
function extraerDetalle(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(" · ");
  return null;
}

export default function CambiarPassword() {
  const navigate = useNavigate();


  const { darkMode } = useTheme();
  const bg     = darkMode ? "#0B0F19" : "#F9FAFB";
  const card   = darkMode ? "#111827" : "#FFFFFF";
  const border = darkMode ? "#1F2937" : "#E5E7EB";
  const text   = darkMode ? "#F9FAFB" : "#111827";
  const sub    = darkMode ? "#9CA3AF" : "#6B7280";
  const input  = darkMode ? "#1F2937" : "#F3F4F6";

  const [form, setForm] = useState({ password_actual: "", nueva_password: "", confirmar: "" });
  const [show, setShow] = useState({ actual: false, nueva: false, confirmar: false });
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleShow = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  // Validación en vivo
  const checks = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.test(form.nueva_password) })),
    [form.nueva_password]
  );
  const cumpleRequisitos = checks.every((c) => c.ok);
  const coincide  = form.nueva_password.length > 0 && form.nueva_password === form.confirmar;
  const formValido = form.password_actual.length > 0 && cumpleRequisitos && coincide;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formValido) {
      if (!cumpleRequisitos) setError("La nueva contraseña no cumple con los requisitos de seguridad.");
      else if (!coincide)    setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.cambiarPassword({
        password_actual: form.password_actual,
        nueva_password: form.nueva_password,
      });
      setOk(true);
      // pequeño respiro para que se vea el mensaje de éxito
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      const detalle = extraerDetalle(err);
      // El backend ya manda mensajes claros ("Contraseña actual incorrecta",
      // "Contraseña débil. Requisitos: ..."), así que los mostramos tal cual.
      setError(detalle || "Error al cambiar la contraseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Campo de contraseña reutilizable con ojito
  const CampoPassword = ({ campo, label, value, autoFocus }) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontSize: 13, color: sub, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show[campo] ? "text" : "password"}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => set(campo === "actual" ? "password_actual" : campo === "nueva" ? "nueva_password" : "confirmar", e.target.value)}
          style={{
            width: "100%", padding: "0.6rem 2.4rem 0.6rem 0.75rem",
            borderRadius: 8, border: `1px solid ${border}`,
            background: input, color: text, fontSize: 14, outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => toggleShow(campo)}
          tabIndex={-1}
          aria-label={show[campo] ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: sub,
            display: "flex", alignItems: "center", padding: 4,
          }}
        >
          {show[campo] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "2rem", background: card, border: `1px solid ${border}`, borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>

        {/* Icono + título */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock size={20} color="#6366F1" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: text, margin: 0 }}>Cambia tu contraseña</h2>
        </div>
        <p style={{ color: sub, marginBottom: "1.5rem", fontSize: 13.5, lineHeight: 1.5 }}>
          Por seguridad debes establecer una nueva contraseña antes de continuar.
        </p>

        {ok ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <ShieldCheck size={44} color="#22C55E" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: text, fontWeight: 600, fontSize: 15 }}>Contraseña actualizada</p>
            <p style={{ color: sub, fontSize: 13, marginTop: 4 }}>Redirigiendo…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CampoPassword campo="actual"    label="Contraseña actual (temporal)" value={form.password_actual} autoFocus />
            <CampoPassword campo="nueva"     label="Nueva contraseña"             value={form.nueva_password} />
            <CampoPassword campo="confirmar" label="Confirmar nueva contraseña"   value={form.confirmar} />

            {/* Checklist de requisitos en vivo */}
            <div style={{ background: input, borderRadius: 10, padding: "0.75rem 0.9rem", marginBottom: "1rem" }}>
              {checks.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: c.ok ? "#22C55E" : sub, marginBottom: 4 }}>
                  {c.ok ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}
                  {c.label}
                </div>
              ))}
              {/* Coincidencia */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: coincide ? "#22C55E" : sub, marginTop: 2 }}>
                {coincide ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}
                Las contraseñas coinciden
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13, borderRadius: 8, padding: "0.6rem 0.8rem", marginBottom: "1rem", lineHeight: 1.45 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formValido}
              style={{
                width: "100%", padding: "0.7rem", borderRadius: 8, border: "none",
                background: formValido ? "#6366F1" : "#4B5563",
                color: "#fff", cursor: formValido && !loading ? "pointer" : "not-allowed",
                fontWeight: 600, fontSize: 14, opacity: loading ? 0.7 : 1, transition: "background .15s",
              }}
            >
              {loading ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}