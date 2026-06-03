import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Check, X, Lock, Mail, MailCheck, ShieldCheck, ArrowLeft } from "lucide-react";
import { authAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/* Estándares de contraseña (deben coincidir con validar_fortaleza_password del backend) */
const REQUISITOS = [
  { id: "longitud",  label: "Mínimo 8 caracteres",          test: (p) => p.length >= 8 },
  { id: "mayuscula", label: "Al menos una mayúscula",       test: (p) => /[A-Z]/.test(p) },
  { id: "simbolo", label: 'Al menos un símbolo (!@#$%^&*(),.?":{}|<>_-)', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p) },
];

function extraerDetalle(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(" · ");
  return null;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token"); // si viene token → modo restablecer

  // Tema: lee la preferencia guardada en el login para mantener coherencia
  const { darkMode: dark } = useTheme();
  const bg     = dark ? "#0B0F19" : "#F1F5F9";
  const card   = dark ? "#111827" : "#FFFFFF";
  const border = dark ? "#1F2937" : "#E5E7EB";
  const text   = dark ? "#F9FAFB" : "#0F172A";
  const sub    = dark ? "#9CA3AF" : "#64748B";
  const input  = dark ? "#1A1F33" : "#F8FAFC";
  const inputBd = dark ? "#374151" : "#D1D5DB";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "2rem", background: card, border: `1px solid ${border}`, borderRadius: 16, boxShadow: dark ? "0 10px 40px rgba(0,0,0,0.3)" : "0 20px 40px rgba(15,23,42,0.08)" }}>
        {token
          ? <ModoRestablecer  navigate={navigate} token={token} theme={{ card, border, text, sub, input, inputBd }} />
          : <ModoSolicitar    navigate={navigate}              theme={{ card, border, text, sub, input, inputBd }} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODO 1 — Solicitar enlace (sin token)
══════════════════════════════════════════ */
function ModoSolicitar({ navigate, theme }) {
  const { text, sub, input, inputBd } = theme;
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
      // Mensaje neutro: no confirmamos si el correo existe (buena práctica de seguridad)
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
        <h2 style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0 }}>Revisa tu correo</h2>
        <p style={{ color: sub, fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
          Si <strong style={{ color: text }}>{email}</strong> está registrado, te enviamos un enlace para
          restablecer tu contraseña. Revisa también la carpeta de spam.
        </p>
        <button onClick={() => navigate("/login")} style={linkBtn(sub)}>
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <>
      <Encabezado icon={Mail} titulo="Recuperar contraseña"
        desc="Ingresa el correo de tu cuenta y te enviaremos un enlace para restablecer tu contraseña." theme={theme} />

      <label style={{ fontSize: 13, color: sub, display: "block", marginBottom: 6 }}>Correo electrónico</label>
      <input
        type="email"
        value={email}
        autoFocus
        placeholder="tu@pisst.com"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && solicitar()}
        style={inputStyle(input, inputBd, text)}
      />

      {error && <Banner>{error}</Banner>}

      <button onClick={solicitar} disabled={loading} style={primaryBtn(loading || !email)}>
        {loading ? "Enviando…" : "Enviar enlace"}
      </button>
      <button onClick={() => navigate("/login")} style={linkBtn(sub)}>
        <ArrowLeft size={14} /> Volver al inicio de sesión
      </button>
    </>
  );
}

/* ══════════════════════════════════════════
   MODO 2 — Restablecer (con token en la URL)
══════════════════════════════════════════ */
function ModoRestablecer({ navigate, token, theme }) {
  const { text, sub, input, inputBd } = theme;
  const [form, setForm] = useState({ new_password: "", confirmar: "" });
  const [show, setShow] = useState({ nueva: false, confirmar: false });
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.test(form.new_password) })),
    [form.new_password]
  );
  const cumple   = checks.every((c) => c.ok);
  const coincide = form.new_password.length > 0 && form.new_password === form.confirmar;
  const valido   = cumple && coincide;

  async function restablecer() {
    setError("");
    if (!valido) {
      setError(!cumple ? "La contraseña no cumple los requisitos." : "Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: form.new_password });
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
        <h2 style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0 }}>Contraseña restablecida</h2>
        <p style={{ color: sub, fontSize: 13.5, marginTop: 8 }}>Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  const Campo = ({ campo, field, label, autoFocus }) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontSize: 13, color: sub, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show[campo] ? "text" : "password"}
          value={form[field]}
          autoFocus={autoFocus}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          style={{ ...inputStyle(input, inputBd, text), paddingRight: "2.4rem", marginBottom: 0 }}
        />
        <button type="button" onClick={() => setShow((s) => ({ ...s, [campo]: !s[campo] }))} tabIndex={-1}
          aria-label={show[campo] ? "Ocultar" : "Mostrar"}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: sub, display: "flex", padding: 4 }}>
          {show[campo] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Encabezado icon={Lock} titulo="Nueva contraseña"
        desc="Crea una contraseña segura para tu cuenta." theme={theme} />

      <Campo campo="nueva"     field="new_password" label="Nueva contraseña" autoFocus />
      <Campo campo="confirmar" field="confirmar"    label="Confirmar contraseña" />

      <div style={{ background: input, borderRadius: 10, padding: "0.75rem 0.9rem", marginBottom: "1rem" }}>
        {checks.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: c.ok ? "#22C55E" : sub, marginBottom: 4 }}>
            {c.ok ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}{c.label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: coincide ? "#22C55E" : sub }}>
          {coincide ? <Check size={14} /> : <X size={14} style={{ opacity: 0.5 }} />}Las contraseñas coinciden
        </div>
      </div>

      {error && <Banner>{error}</Banner>}

      <button onClick={restablecer} disabled={loading || !valido} style={primaryBtn(loading || !valido)}>
        {loading ? "Guardando…" : "Restablecer contraseña"}
      </button>
    </>
  );
}

/* ── Subcomponentes / estilos compartidos ── */
function Encabezado({ icon: Icon, titulo, desc, theme }) {
  const { text, sub } = theme;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color="#6366F1" />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: text, margin: 0 }}>{titulo}</h2>
      </div>
      <p style={{ color: sub, marginBottom: "1.5rem", fontSize: 13.5, lineHeight: 1.5 }}>{desc}</p>
    </>
  );
}

const Banner = ({ children }) => (
  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13, borderRadius: 8, padding: "0.6rem 0.8rem", marginBottom: "1rem", lineHeight: 1.45 }}>
    {children}
  </div>
);

const inputStyle = (bg, bd, color) => ({
  width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8,
  border: `1px solid ${bd}`, background: bg, color, fontSize: 14, outline: "none", marginBottom: "1rem",
});

const primaryBtn = (disabled) => ({
  width: "100%", padding: "0.7rem", borderRadius: 8, border: "none",
  background: disabled ? "#4B5563" : "#6366F1", color: "#fff",
  cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, transition: "background .15s",
});

const linkBtn = (color) => ({
  width: "100%", marginTop: 12, background: "none", border: "none", color,
  fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
});