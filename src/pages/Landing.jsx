import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  BarChart3,
  Bot,
  Zap,
  Lock,
  Smartphone,
  FolderX,
  TrendingDown,
  Search,
  EyeOff,
  Scale,
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  ShieldAlert,
  LineChart,
  HardHat,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Check,
} from 'lucide-react'

import pisstLogo from '../assets/imagenes/pisst_logo.png'
import fondoLanding2 from '../assets/imagenes/fondoLanding2.jpeg'
import concasco from '../assets/imagenes/concasco-removebg-preview.png'
import sincasco from '../assets/imagenes/sincasco-removebg-preview.png'
import logoChat from '../assets/imagenes/logo_chat.png'

function interpolateStops(local, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1]
    if (local >= a.at && local <= b.at) {
      const t = (local - a.at) / (b.at - a.at)
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        opacity: a.opacity + (b.opacity - a.opacity) * t,
      }
    }
  }
  return stops[stops.length - 1]
}

function getMascotState(progress, start, end, stops) {
  if (progress <= start) return stops[0]
  if (progress >= end) return stops[stops.length - 1]
  const local = (progress - start) / (end - start)
  return interpolateStops(local, stops)
}

const RIGHT_MASCOT_STOPS = [
  { at: 0,    x: 130,  y: 0,   opacity: 0 },
  { at: 0.12, x: 0,    y: 0,   opacity: 1 },
  { at: 0.35, x: 0,    y: -70, opacity: 1 },
  { at: 0.65, x: -220, y: -30, opacity: 1 },
  { at: 1,    x: 130,  y: 0,   opacity: 0 },
]

const LEFT_MASCOT_STOPS = [
  { at: 0,    x: -130, y: 0,   opacity: 0 },
  { at: 0.12, x: 0,    y: 0,   opacity: 1 },
  { at: 0.35, x: 0,    y: -70, opacity: 1 },
  { at: 0.65, x: 220,  y: -30, opacity: 1 },
  { at: 1,    x: -130, y: 0,   opacity: 0 },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const NAV_LINKS = [
  { label: 'INICIO', href: '#hero' },
  { label: 'PROBLEMA', href: '#problema' },
  { label: 'SOLUCIÓN', href: '#solucion' },
  { label: 'MÓDULOS', href: '#modulos' },
  { label: 'IMPACTO', href: '#impacto' },
]

const HERO_CHIPS = [
  { icon: ShieldCheck, color: '#3B82F6', text: 'Normativa Cumplida', style: { top: '34%', left: '8%' }, duration: 4.2, delay: 0 },
  { icon: BarChart3, color: '#FBBF24', text: 'Datos en Tiempo Real', style: { top: '32%', right: '8%' }, duration: 3.6, delay: 0.4 },
  { icon: Bot, color: '#8B5CF6', text: 'IA Integrada', style: { top: '50%', left: '4%' }, duration: 5, delay: 0.8 },
  { icon: Zap, color: '#FACC15', text: 'Automatización', style: { top: '48%', right: '4%' }, duration: 3.8, delay: 1.2 },
  { icon: Lock, color: '#2563FF', text: 'Trazabilidad Legal', style: { top: '66%', left: '10%' }, duration: 4.6, delay: 1.6 },
  { icon: Smartphone, color: '#7C3AED', text: 'Accesible desde móvil', style: { top: '64%', right: '10%' }, duration: 5.4, delay: 2 },
]

const PROBLEM_ITEMS = [
  { icon: FolderX, text: 'Incidentes que no se investigan a tiempo' },
  { icon: TrendingDown, text: 'Capacitaciones sin trazabilidad de asistencia' },
  { icon: Search, text: 'Auditorías cuyos hallazgos se pierden' },
  { icon: EyeOff, text: 'Gerencia sin visibilidad real del riesgo' },
  { icon: Scale, text: 'Riesgo permanente de sanciones legales' },
]

const BENEFITS = [
  'Cumplimiento del Decreto 1072/2015 y Resolución 0312/2019',
  'FURAT automático al investigar un incidente',
  'Certificados PDF por capacitación',
  'Alertas de vencimiento automáticas',
  'Dashboard exportable en PDF y Excel',
  'SASBOT IA: asistente normativo en lenguaje natural',
]

const PLATFORM_VALUES = [
  { icon: ShieldCheck, title: 'Cumplimiento normativo', desc: 'Alineado con el Decreto 1072/2015 y la Resolución 0312/2019.' },
  { icon: Zap, title: 'Automatización real', desc: 'Reduce el trabajo manual repetitivo en procesos de SST.' },
  { icon: LineChart, title: 'Visibilidad total', desc: 'Información centralizada y accesible en un solo dashboard.' },
  { icon: Bot, title: 'Asistencia con IA', desc: 'SASBOT disponible para consultas normativas en lenguaje natural.' },
]

const MODULES = [
  {
    icon: AlertTriangle,
    title: 'INCIDENTES',
    desc: 'Reporte en tiempo real con generación automática del formulario FURAT conforme a la Resolución 0156/2005.',
    highlight: null,
  },
  {
    icon: BookOpen,
    title: 'CAPACITACIONES',
    desc: 'Sesiones, control de asistencia, evaluaciones y certificados automáticos en PDF para cada participante.',
    highlight: null,
  },
  {
    icon: ClipboardCheck,
    title: 'AUDITORÍAS',
    desc: 'Hallazgos, no conformidades y acciones correctivas con alertas de vencimiento para que nada quede sin cerrar.',
    highlight: 'purple',
  },
  {
    icon: ShieldAlert,
    title: 'RIESGOS',
    desc: 'Matrices GTC-45 automatizadas. Identifica peligros, asigna controles y haz seguimiento del estado en tiempo real.',
    highlight: null,
  },
  {
    icon: LineChart,
    title: 'DASHBOARD',
    desc: 'KPIs de accidentalidad y cumplimiento normativo. Filtros por mes, trimestre y año. Exporta en PDF y Excel.',
    highlight: null,
  },
  {
    icon: null,
    title: 'SASBOT IA',
    desc: 'Asistente normativo en lenguaje natural. Cualquier empleado puede reportar un incidente o consultar normativa SST desde el chat en segundos.',
    highlight: 'yellow',
    image: logoChat,
  },
]

const ROLE_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Encargado SST',
    desc: 'Deja de dedicar gran parte del tiempo al papeleo. Gestiona incidentes, riesgos, capacitaciones y auditorías desde un solo panel. Cumple la normativa sin estrés.',
    tag: 'Ahorra horas de trabajo manual',
    tagColor: '#8B5CF6',
    featured: false,
  },
  {
    icon: BarChart3,
    title: 'Gerencia',
    desc: 'Toma decisiones con datos reales, no suposiciones. Dashboard en tiempo real y demuéstrale a cualquier inspector del Ministerio del Trabajo el estado de cumplimiento en segundos.',
    tag: 'Visibilidad en tiempo real',
    tagColor: '#3B82F6',
    featured: true,
  },
  {
    icon: HardHat,
    title: 'Empleado',
    desc: 'Por primera vez tienes una voz directa en el sistema de seguridad de tu empresa. Reporta riesgos desde tu celular antes de que se conviertan en accidentes.',
    tag: 'Canal directo de reporte',
    tagColor: '#FBBF24',
    featured: false,
  },
]

const FOOTER_COLUMNS = [
  {
    title: 'PRODUCTOS',
    links: ['Automatización', 'Análisis de datos', 'Generación de contenido', 'Integraciones'],
  },
  {
    title: 'RECURSOS',
    links: ['Blog', 'Guías', 'Documentación', 'Centro de ayuda'],
  },
  {
    title: 'COMPAÑÍA',
    links: ['Sobre nosotros', 'Trabaja con nosotros', 'Políticas de privacidad', 'Términos y condiciones'],
  },
]

const cardShadow = '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 25px 50px -20px rgba(0,0,0,0.6)'

function SectionLabel({ children, color }) {
  return (
    <p
      className="flex items-center gap-2 text-xs uppercase tracking-widest mb-4"
      style={{ color }}
    >
      <Sparkles size={14} /> {children}
    </p>
  )
}

function HeroChip({ icon: Icon, color, text, style, duration, delay }) {
  return (
    <motion.div
      className="hidden md:flex items-center gap-2 absolute px-3 py-1.5 rounded-full text-xs backdrop-blur-sm z-[5]"
      style={{
        ...style,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#CBD5E1',
        fontFamily: 'Inter, sans-serif',
      }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <span
        className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
        style={{ background: color }}
      >
        <Icon size={13} color="#05070D" strokeWidth={2.5} />
      </span>
      {text}
    </motion.div>
  )
}

function ProblemItem({ icon: Icon, text }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center gap-4 rounded-xl p-5"
      style={{ background: '#121826', border: '1px solid #1e2a3a', boxShadow: cardShadow }}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
        style={{ background: 'rgba(124,58,237,0.12)' }}
      >
        <Icon size={20} color="#A78BFA" />
      </span>
      <span className="text-sm md:text-base" style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
        {text}
      </span>
    </motion.div>
  )
}

function ModuleCard({ icon: Icon, title, desc, highlight, image }) {
  const borderColor =
    highlight === 'purple' ? '#7C3AED' : highlight === 'yellow' ? '#FACC15' : '#1e2a3a'
  const linkColor = highlight === 'yellow' ? '#FACC15' : '#3B82F6'
  const shadow =
    highlight === 'purple'
      ? '0 0 0 1px rgba(124,58,237,0.3), 0 30px 60px -20px rgba(124,58,237,0.25)'
      : highlight === 'yellow'
      ? '0 0 0 1px rgba(250,204,21,0.3), 0 30px 60px -20px rgba(250,204,21,0.2)'
      : cardShadow

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-6 cursor-default"
      style={{ background: '#121826', border: `1px solid ${borderColor}`, boxShadow: shadow }}
    >
      {image ? (
        <img src={image} alt="Logo del chat SASBOT" className="w-10 h-10 mb-4 object-contain" />
      ) : (
        <div
          className="flex items-center justify-center w-12 h-12 rounded-lg mb-4"
          style={{ background: 'rgba(37,99,255,0.12)' }}
        >
          <Icon size={22} color="#3B82F6" />
        </div>
      )}
      <h3
        className="text-lg font-bold uppercase mb-3"
        style={{ color: '#F8FAFC', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm mb-4" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
        {desc}
      </p>
      <span className="inline-flex items-center" style={{ color: linkColor }}>
        <ArrowRight size={16} />
      </span>
    </motion.div>
  )
}

function BenefitCard({ icon: Icon, title, desc, tag, tagColor, featured }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-2xl p-8 flex-1"
      style={{
        background: featured
          ? 'linear-gradient(160deg, #1a1438 0%, #121826 60%)'
          : '#121826',
        border: featured ? '1px solid #7C3AED' : '1px solid #1e2a3a',
        boxShadow: featured
          ? '0 0 0 1px rgba(124,58,237,0.25), 0 30px 60px -20px rgba(124,58,237,0.3)'
          : cardShadow,
      }}
    >
      <div
        className="flex items-center justify-center w-14 h-14 rounded-xl mb-5"
        style={{ background: `${tagColor}1F` }}
      >
        <Icon size={26} color={tagColor} />
      </div>
      <h3 className="text-xl font-bold mb-3" style={{ color: '#F8FAFC', fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
        {desc}
      </p>
      <span
        className="inline-block text-xs px-3 py-1 rounded-full"
        style={{ border: `1px solid ${tagColor}`, color: tagColor, fontFamily: 'Inter, sans-serif' }}
      >
        {tag}
      </span>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? window.scrollY / total : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const rightMascot = getMascotState(scrollProgress, 0.06, 0.34, RIGHT_MASCOT_STOPS)
  const leftMascot  = getMascotState(scrollProgress, 0.42, 0.70, LEFT_MASCOT_STOPS)

  const goToLogin = useCallback(() => navigate('/login'), [navigate])

  const handleNavClick = (href) => {
    setMobileMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#05070D', color: '#F8FAFC' }}>
      {/* NAVBAR */}
      <nav
        className="fixed top-0 left-0 w-full z-50 h-20 flex items-center justify-between px-6 md:px-10"
        style={{ background: 'transparent' }}
      >
        <img src={pisstLogo} alt="Logo de PISST" className="h-16 w-auto object-contain" />

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm uppercase tracking-widest transition-colors duration-200"
              style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <button
            onClick={goToLogin}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)',
              boxShadow: '0 0 24px rgba(37,99,255,0.5)',
            }}
          >
            INICIAR SESIÓN <ArrowRight size={16} />
          </button>
        </div>

        <button
          className="md:hidden"
          style={{ color: '#F8FAFC' }}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Abrir menú de navegación"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed top-20 left-0 w-full z-40 flex flex-col px-6 py-4 gap-4"
          style={{ background: '#05070D' }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm uppercase tracking-widest text-left"
              style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={goToLogin}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white mt-2"
            style={{
              background: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)',
              boxShadow: '0 0 24px rgba(37,99,255,0.5)',
            }}
          >
            INICIAR SESIÓN <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* SASBOT — se asoma por los bordes mientras se hace scroll */}
      <motion.div
        className="fixed z-40 pointer-events-none w-[120px] h-[120px]"
        style={{ top: '38%', right: 0 }}
        animate={{ x: rightMascot.x, y: rightMascot.y, opacity: rightMascot.opacity }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <img src={sincasco} alt="SASBOT sin casco asomándose" className="w-full h-full object-contain" />
      </motion.div>

      <motion.div
        className="fixed z-40 pointer-events-none w-[120px] h-[120px]"
        style={{ top: '58%', left: 0 }}
        animate={{ x: leftMascot.x, y: leftMascot.y, opacity: leftMascot.opacity }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <img src={concasco} alt="SASBOT con casco asomándose" className="w-full h-full object-contain" />
      </motion.div>

      {/* HERO */}
      <section id="hero" className="relative h-screen overflow-hidden">
        <img
          src={fondoLanding2}
          alt="Trabajadores en entorno industrial seguro"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ objectPosition: 'center top' }}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,7,13,0.3) 0%, rgba(5,7,13,0.5) 60%, rgba(5,7,13,1) 100%)',
          }}
        />

        {HERO_CHIPS.map((chip, i) => (
          <HeroChip key={i} {...chip} />
        ))}

        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-4 sm:px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-2 text-xs uppercase tracking-widest rounded-full px-4 py-1.5 mb-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8' }}
          >
            <Sparkles size={14} /> PISST — Seguridad y Salud en el Trabajo
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="block">La plataforma que</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)' }}
            >
              protege vidas
            </span>
            <span className="block">y cumple la ley.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg max-w-lg mt-6"
            style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}
          >
            Digitaliza tu SG-SST. Cumple el Decreto 1072/2015 sin carpetas, sin Excel y sin estrés.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={goToLogin}
            className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white mt-8"
            style={{
              background: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)',
              boxShadow: '0 0 30px rgba(37,99,255,0.45)',
            }}
          >
            INICIAR SESIÓN <ArrowRight size={18} />
          </motion.button>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-10"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <ChevronDown size={22} />
          </motion.div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="py-24 px-6 md:px-12" style={{ background: '#0A1020' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInUp}>
            <SectionLabel color="#7C3AED">EL PROBLEMA</SectionLabel>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Las empresas colombianas están obligadas por ley.
            <br />
            La mayoría lo hacen con Excel y papel.
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="max-w-2xl mb-12 text-base"
            style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
          >
            El Decreto 1072 de 2015 obliga a toda empresa a implementar un SG-SST. Sin
            herramientas adecuadas, el resultado son carpetas perdidas, incidentes sin investigar
            y un riesgo constante de sanciones legales para la organización.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {PROBLEM_ITEMS.map((item) => (
              <ProblemItem key={item.text} {...item} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section id="solucion" className="py-24 px-6 md:px-12" style={{ background: '#05070D' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="flex-1"
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel color="#2563FF">LA SOLUCIÓN</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              PISST digitaliza el proceso completo.
              <br />
              De la carpeta al dashboard en tiempo real.
            </motion.h2>

            <motion.p variants={fadeInUp} className="mb-8 text-base" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              Centraliza incidentes, riesgos, capacitaciones y auditorías en una sola plataforma
              web. Accesible desde cualquier dispositivo, con alertas automáticas y generación de
              documentos legales obligatorios en un clic.
            </motion.p>

            <motion.ul variants={staggerContainer} className="space-y-3 mb-8">
              {BENEFITS.map((b) => (
                <motion.li
                  key={b}
                  variants={fadeInUp}
                  className="flex items-start gap-2 text-base"
                  style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}
                >
                  <Check size={18} color="#2563FF" className="mt-0.5 shrink-0" /> {b}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex-1 rounded-2xl p-8"
            style={{
              background: 'linear-gradient(160deg, #14203b 0%, #121826 55%, #1a1438 100%)',
              border: '1px solid #1e2a3a',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 30px 60px -20px rgba(37,99,255,0.2)',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-8" style={{ color: '#94A3B8' }}>
              VALORES DE LA PLATAFORMA
            </p>
            <div className="flex flex-col">
              {PLATFORM_VALUES.map((value, i) => (
                <div
                  key={value.title}
                  className="flex items-start gap-4 py-5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <value.icon size={20} color="#F8FAFC" />
                  </span>
                  <div>
                    <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {value.title}
                    </p>
                    <p className="text-sm" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="py-24 px-6 md:px-12 text-center" style={{ background: '#0A1020' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="flex justify-center"
        >
          <SectionLabel color="#7C3AED">MÓDULOS EN PRODUCCIÓN</SectionLabel>
        </motion.div>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="text-4xl font-bold mb-16"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Todo lo que tu empresa necesita
          <br />
          para cumplir el SG-SST.
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left"
        >
          {MODULES.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </motion.div>
      </section>

      {/* IMPACTO */}
      <section id="impacto" className="py-24 px-6 md:px-12 text-center" style={{ background: '#05070D' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="flex justify-center"
        >
          <SectionLabel color="#2563FF">DISEÑADO PARA TODOS EN TU EMPRESA</SectionLabel>
        </motion.div>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="text-4xl font-bold mb-16"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          La herramienta que cada rol necesitaba.
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 text-left"
        >
          {ROLE_CARDS.map((card) => (
            <BenefitCard key={card.title} {...card} />
          ))}
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section
        className="relative py-32 px-6 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A1020 0%, #1a0a3a 50%, #0A1020 100%)',
          borderTop: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <img src={pisstLogo} alt="Logo de PISST" className="h-24 w-auto object-contain mx-auto mb-8" />

          <h2
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ¿Listo para proteger
            <br />a tu equipo de trabajo?
          </h2>

          <p className="max-w-lg mx-auto mt-4 text-base" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
            Únete a las empresas colombianas que ya gestionan su SG-SST de forma digital,
            eficiente y sin estrés.
          </p>

          <button
            onClick={goToLogin}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg text-lg font-bold mt-10 transition-colors duration-200"
            style={{ background: '#FBBF24', color: '#05070D' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FDE047')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FBBF24')}
          >
            INICIAR SESIÓN <ArrowRight size={20} />
          </button>

          <p className="text-xs mt-3" style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
            No necesitas tarjeta de crédito.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-16 px-8"
        style={{ background: '#030508', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div>
            <img src={pisstLogo} alt="Logo de PISST" className="h-28 w-auto object-contain mb-4" />
            <p className="text-sm max-w-xs" style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
              Plataforma Integral de Seguridad y Salud en el Trabajo
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#374151' }}>
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <span
                      className="text-sm cursor-default transition-colors duration-200"
                      style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}
                    >
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#374151' }}>
              SÍGUENOS
            </p>
            <div className="flex gap-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#4B5563' }}>
                <path
                  d="M22 4.01c-.77.35-1.6.59-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.49-1.75.85-2.72 1.05A4.13 4.13 0 0 0 11.6 7.5a4.27 4.27 0 0 0 .1.93A11.65 11.65 0 0 1 3 3.8s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5 0-.18 0-.35-.01-.53A8.35 8.35 0 0 0 22 4.01Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#4B5563' }}>
                <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10 9h4v2s1-2 4-2 5 2 5 6v6h-4v-6c0-2-1-3-3-3s-2 1-2 3v6h-4V9z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#4B5563' }}>
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 9l5 3-5 3V9z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-xs" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
            © 2026 PISST. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
