import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Check, X, Lock, Mail, MailCheck, ShieldCheck, ArrowLeft } from "lucide-react";
import { authAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const REQUISITOS = [
  { id: "longitud",  label: "Mínimo 8 caracteres",                           test: (p) => p.length >= 8 },
  { id: "mayuscula", label: "Al menos una mayúscula",                        test: (p) => /[A-Z]/.test(p) },
  { id: "simbolo",   label: 'Al menos un símbolo (!@#$%^&*(),.?":{}|<>_-)', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p) },
];

function extraerDetalle(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(" · ");
  return null;
}

/* ──────────────────────────────────────────
   Subcomponentes FUERA de cualquier padre
   para que React no los destruya en cada render
─────────────────────────────────────────── */
function CampoPassword({ label, value, onChange, mostrar, onToggle, autoFocus, theme }) {
  const { sub, input, inputBd, text } = theme;
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
            width: "100%", padding: "0.6rem 2.4rem 0.6rem 0.75rem",
            borderRadius: 8, border: `1px solid ${inputBd}`,
            background: input, color: text, fontSize: 14,
            outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={mostrar ? "Ocultar" : "Mostrar"}
          style={{
            position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", background: "none",
            border: "none", cursor: "pointer", color: sub,
            display: "flex", padding: 4,
          }}
        >
          {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function Encabezado({ icon: Icon, titulo, desc, theme }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(99,102,241,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={20} color="#6366F1" />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: theme.text, margin: 0 }}>{titulo}</h2>
      </div>
      <p style={{ color: theme.sub, marginBottom: "1.5rem", fontSize: 13.5, lineHeight: 1.5 }}>{desc}</p>
    </>
  );
}

const Banner = ({ children }) => (
  <div style={{
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#F87171", fontSize: 13, borderRadius: 8,
    padding: "0.6rem 0.8rem", marginBottom: "1rem", lineHeight: 1.45,
  }}>
    {children}
  </div>
);

const primaryBtn = (disabled) => ({
  width: "100%", padding: "0.7rem", borderRadius: 8, border: "none",
  background: disabled ? "#4B5563" : "#6366F1", color: "#fff",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 600, fontSize: 14, transition: "background .15s",
});

const linkBtn = (color) => ({
  width: "100%", marginTop: 12, background: "none", border: "none", color,
  fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
});

/* ──────────────────────────────────────────
   MODO 1 — Solicitar enlace
─────────────────────────────────────────── */
function ModoSolicitar({ navigate, theme }) {
  const [email, setEmail]     = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function solicitar() {
    if (!email) { setError("Ingresa tu correo electrónico."); return; }
    setError("");
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setEnviado(true);
    } catch (err) {
      setError(extraerDetalle(err) || "No pudimos procesar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <MailCheck size={44} color="#22C55E" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: 0 }}>Revisa tu correo</h2>
        <p style={{ color: theme.sub, fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
          Si <strong style={{ color: theme.text }}>{email}</strong> está registrado, te enviamos
          un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
        </p>
        <button onClick={() => navigate("/login")} style={linkBtn(theme.sub)}>
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <>
      <Encabezado
        icon={Mail}
        titulo="Recuperar contraseña"
        desc="Ingresa el correo de tu cuenta y te enviaremos un enlace para restablecer tu contraseña."
        theme={theme}
      />
      <label style={{ fontSize: 13, color: theme.sub, display: "block", marginBottom: 6 }}>
        Correo electrónico
      </label>
      <input
        type="email"
        value={email}
        autoFocus
        placeholder="tu@pisst.com"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && solicitar()}
        style={{
          width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8,
          border: `1px solid ${theme.inputBd}`, background: theme.input,
          color: theme.text, fontSize: 14, outline: "none",
          marginBottom: "1rem", boxSizing: "border-box",
        }}
      />
      {error && <Banner>{error}</Banner>}
      <button onClick={solicitar} disabled={loading || !email} style={primaryBtn(loading || !email)}>
        {loading ? "Enviando…" : "Enviar enlace"}
      </button>
      <button onClick={() => navigate("/login")} style={linkBtn(theme.sub)}>
        <ArrowLeft size={14} /> Volver al inicio de sesión
      </button>
    </>
  );
}

/* ──────────────────────────────────────────
   MODO 2 — Restablecer con token
─────────────────────────────────────────── */
function ModoRestablecer({ navigate, token, theme }) {
  const [form, setForm]       = useState({ nueva: "", confirmar: "" });
  const [show, setShow]       = useState({ nueva: false, confirmar: false });
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const toggleShow   = (campo) => setShow((s) => ({ ...s, [campo]: !s[campo] }));

  const checks = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.test(form.nueva) })),
    [form.nueva]
  );
  const cumple   = checks.every((c) => c.ok);
  const coincide = form.nueva.length > 0 && form.nueva === form.confirmar;
  const valido   = cumple && coincide;

  async function restablecer() {
    setError("");
    if (!valido) {
      setError(!cumple ? "La contraseña no cumple los requisitos." : "Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, nueva_password: form.nueva });
      setOk(true);
      setTimeout(() => navigate("/login?reset=ok"), 1400);
    } catch (err) {
      setError(extraerDetalle(err) || "El enlace no es válido o ha expirado. Solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <ShieldCheck size={44} color="#22C55E" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: 0 }}>
          Contraseña restablecida
        </h2>
        <p style={{ color: theme.sub, fontSize: 13.5, marginTop: 8 }}>
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }

  return (
    <>
      <Encabezado
        icon={Lock}
        titulo="Nueva contraseña"
        desc="Crea una contraseña segura para tu cuenta."
        theme={theme}
      />

      <CampoPassword
        label="Nueva contraseña"
        value={form.nueva}
        onChange={handleChange("nueva")}
        mostrar={show.nueva}
        onToggle={() => toggleShow("nueva")}
        autoFocus
        theme={theme}
      />

      <CampoPassword
        label="Confirmar contraseña"
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
          fontSize: 12.5, color: coincide ? "#22C55E" : theme.sub,
        }}>
          {coincide ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}
          Las contraseñas coinciden
        </div>
      </div>

      {error && <Banner>{error}</Banner>}

      <button onClick={restablecer} disabled={loading || !valido} style={primaryBtn(loading || !valido)}>
        {loading ? "Guardando…" : "Restablecer contraseña"}
      </button>
    </>
  );
}

/* ──────────────────────────────────────────
   Componente raíz
─────────────────────────────────────────── */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token    = params.get("token");

  const { darkMode: dark } = useTheme();

  const theme = {
    bg:      dark ? "#0B0F19" : "#F1F5F9",
    card:    dark ? "#111827" : "#FFFFFF",
    border:  dark ? "#1F2937" : "#E5E7EB",
    text:    dark ? "#F9FAFB" : "#0F172A",
    sub:     dark ? "#9CA3AF" : "#64748B",
    input:   dark ? "#1A1F33" : "#F8FAFC",
    inputBd: dark ? "#374151" : "#D1D5DB",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: theme.bg, padding: "1rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: "2rem",
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16,
        boxShadow: dark ? "0 10px 40px rgba(0,0,0,0.3)" : "0 20px 40px rgba(15,23,42,0.08)",
      }}>
        {token
          ? <ModoRestablecer navigate={navigate} token={token} theme={theme} />
          : <ModoSolicitar   navigate={navigate}              theme={theme} />
        }
      </div>
    </div>
  );
}