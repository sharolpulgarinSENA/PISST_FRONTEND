import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, X, Lock, ShieldCheck } from "lucide-react";
import { authAPI, getErrorMessage } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";

const REQUISITOS = [
  { id: "longitud",  label: "Mínimo 8 caracteres",                           test: (p) => p.length >= 8 },
  { id: "mayuscula", label: "Al menos una mayúscula",                        test: (p) => /[A-Z]/.test(p) },
  { id: "simbolo",   label: 'Al menos un símbolo (!@#$%^&*(),.?":{}|<>_-)', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p) },
];

/* ──────────────────────────────────────────
   CampoPassword FUERA del padre para que
   React no lo destruya en cada render
─────────────────────────────────────────── */
function CampoPassword({ label, value, onChange, mostrar, onToggle, autoFocus, theme }) {
  const { sub, border, input, text } = theme;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontSize: 13, color: sub, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={mostrar ? "text" : "password"}
          value={value}
          autoFocus={autoFocus}
          onChange={onChange}
          style={{
            width: "100%",
            padding: "0.6rem 2.4rem 0.6rem 0.75rem",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: input,
            color: text,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{
            position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", background: "none",
            border: "none", cursor: "pointer", color: sub,
            display: "flex", alignItems: "center", padding: 4,
          }}
        >
          {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Componente principal
─────────────────────────────────────────── */
export default function CambiarPassword() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { darkMode } = useTheme();

  // Guard: si no hay flag, el usuario ya cambió su contraseña.
  // Espera a que `user` esté disponible para no decidir la ruta con datos parciales.
  useEffect(() => {
    if (!user) return;
    const debe = sessionStorage.getItem("pisst_debe_cambiar_password");
    if (!debe) {
      const role = user?.role;
      if (role === ROLES.SST || role === ROLES.GERENCIA) navigate("/dashboard", { replace: true });
      else if (role === ROLES.EMPLEADO) navigate("/empleado/chat", { replace: true });
      else if (role === ROLES.ADMIN) navigate("/admin", { replace: true });
      else navigate("/chat", { replace: true });
    }
  }, [user, navigate]);

  // Tema
  const theme = {
    bg:     darkMode ? "#0B0F19" : "#F9FAFB",
    card:   darkMode ? "#111827" : "#FFFFFF",
    border: darkMode ? "#1F2937" : "#E5E7EB",
    text:   darkMode ? "#F9FAFB" : "#111827",
    sub:    darkMode ? "#CBD5E1" : "#6B7280",
    input:  darkMode ? "#1F2937" : "#F3F4F6",
  };

  const [form, setForm]       = useState({ actual: "", nueva: "", confirmar: "" });
  const [show, setShow]       = useState({ actual: false, nueva: false, confirmar: false });
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleShow = (campo) => setShow((s) => ({ ...s, [campo]: !s[campo] }));
  const handleChange = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const checks = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.test(form.nueva) })),
    [form.nueva]
  );
  const cumpleRequisitos = checks.every((c) => c.ok);
  const coincide         = form.nueva.length > 0 && form.nueva === form.confirmar;
  const formValido       = form.actual.length > 0 && cumpleRequisitos && coincide;

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
        password_actual: form.actual,
        nueva_password:  form.nueva,
      });
      sessionStorage.removeItem("pisst_debe_cambiar_password");
      setOk(true);
      const role    = user?.role;
      const destino = role === ROLES.SST || role === ROLES.GERENCIA ? "/dashboard"
        : role === ROLES.ADMIN ? "/admin"
        : "/chat";
      setTimeout(() => navigate(destino), 1200);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cambiar la contraseña. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: theme.bg, padding: "1rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: "2rem",
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      }}>

        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(99,102,241,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Lock size={20} color="#6366F1" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: theme.text, margin: 0 }}>
            Cambia tu contraseña
          </h2>
        </div>
        <p style={{ color: theme.sub, marginBottom: "1.5rem", fontSize: 13.5, lineHeight: 1.5 }}>
          Por seguridad debes establecer una nueva contraseña antes de continuar.
        </p>

        {ok ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <ShieldCheck size={44} color="#22C55E" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: theme.text, fontWeight: 600, fontSize: 15 }}>Contraseña actualizada</p>
            <p style={{ color: theme.sub, fontSize: 13, marginTop: 4 }}>Redirigiendo…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <CampoPassword
              label="Contraseña actual (temporal)"
              value={form.actual}
              onChange={handleChange("actual")}
              mostrar={show.actual}
              onToggle={() => toggleShow("actual")}
              autoFocus
              theme={theme}
            />

            <CampoPassword
              label="Nueva contraseña"
              value={form.nueva}
              onChange={handleChange("nueva")}
              mostrar={show.nueva}
              onToggle={() => toggleShow("nueva")}
              theme={theme}
            />

            <CampoPassword
              label="Confirmar nueva contraseña"
              value={form.confirmar}
              onChange={handleChange("confirmar")}
              mostrar={show.confirmar}
              onToggle={() => toggleShow("confirmar")}
              theme={theme}
            />

            {/* Checklist */}
            <div style={{
              background: theme.input, borderRadius: 10,
              padding: "0.75rem 0.9rem", marginBottom: "1rem",
            }}>
              {checks.map((c) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12.5, color: c.ok ? "#22C55E" : theme.sub, marginBottom: 4,
                }}>
                  {c.ok ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}
                  {c.label}
                </div>
              ))}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 12.5, color: coincide ? "#22C55E" : theme.sub, marginTop: 2,
              }}>
                {coincide ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}
                Las contraseñas coinciden
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#F87171", fontSize: 13, borderRadius: 8,
                padding: "0.6rem 0.8rem", marginBottom: "1rem", lineHeight: 1.45,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formValido}
              style={{
                width: "100%", padding: "0.7rem", borderRadius: 8, border: "none",
                background: formValido ? "#6366F1" : "#4B5563",
                color: "#fff",
                cursor: formValido && !loading ? "pointer" : "not-allowed",
                fontWeight: 600, fontSize: 14,
                opacity: loading ? 0.7 : 1,
                transition: "background .15s",
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