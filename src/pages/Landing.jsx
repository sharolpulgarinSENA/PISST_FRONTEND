import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  BarChart3,
  HardHat,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Coins,
  AlertTriangle,
  FolderX,
  Banknote,
  MessageCircle,
  ClipboardList,
  Scale,
  BookOpen,
  Search,
  ShieldAlert,
  LineChart,
  Bot,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeft,
  Zap,
  Users,
  LifeBuoy,
  ClipboardCheck,
} from 'lucide-react'

import pisstLogo from '../assets/imagenes/pisst_logo.png'
import fondoLanding2 from '../assets/imagenes/fondoLanding2.jpeg'
import sincasco from '../assets/imagenes/sincasco-removebg-preview.png'
import concasco from '../assets/imagenes/concasco-removebg-preview.png'
import dashboardScreenshot from '../assets/imagenes/screenshots/dashboard-screenshot.png'
import sasbotScreenshot from '../assets/imagenes/screenshots/sasbot-chat-screenshot.png'

import DashboardMockup from '../components/landing/DashboardMockup'
import ModuleCard from '../components/landing/ModuleCard'
import BeneficiaryCard from '../components/landing/BeneficiaryCard'
import AnimatedBar from '../components/landing/AnimatedBar'
import CountUpNumber from '../components/landing/CountUpNumber'

const InteractiveBubble = lazy(() => import('../components/landing/InteractiveBubble'))

const NAV_LINKS = [
  { label: 'INICIO', href: '#hero' },
  { label: 'PROBLEMA', href: '#problema' },
  { label: 'SOLUCIÓN', href: '#solucion' },
  { label: 'SASBOT', href: '#sasbot' },
  { label: 'MÓDULOS', href: '#modulos' },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const HERO_CHIPS = [
  { label: 'Normativa Cumplida', color: '#3B82F6', icon: ShieldCheck, style: { top: '20%', left: '6%' } },
  { label: 'IA Integrada', color: '#A855F7', icon: Bot, style: { top: '18%', right: '6%' } },
  { label: 'Tiempo Real', color: '#FBBF24', icon: Zap, style: { top: '46%', left: '4%' } },
  { label: 'Trazabilidad Legal', color: '#22C55E', icon: ClipboardCheck, style: { top: '48%', right: '4%' } },
  { label: 'Multi-rol', color: '#F472B6', icon: Users, style: { top: '72%', left: '8%' } },
  { label: 'Soporte 24/7', color: '#06B6D4', icon: LifeBuoy, style: { top: '70%', right: '8%' } },
]

const PROBLEM_CHIPS = [
  { icon: Coins, text: '+$500M en sanciones' },
  { icon: AlertTriangle, text: '1 trabajador/día' },
  { icon: FolderX, text: 'Documentos perdidos' },
]

const SOLUTION_FEATURES = [
  {
    text: 'Score SG-SST actualizado en tiempo real',
    style: { top: 0, left: 0, transform: 'translate(-38%, -70%)' },
    Arrow: ArrowDownRight,
    arrowPosition: 'end',
  },
  {
    text: 'Reportes gestionados automáticamente',
    style: { bottom: 0, left: 0, transform: 'translate(-38%, 70%)' },
    Arrow: ArrowUpRight,
    arrowPosition: 'end',
  },
  {
    text: 'Los 4 roles de tu empresa, conectados a la vez',
    style: { top: '42%', right: 0, transform: 'translate(48%, -50%)' },
    Arrow: ArrowLeft,
    arrowPosition: 'start',
  },
]

const SASBOT_CHIPS = [
  { icon: MessageCircle, text: 'Lenguaje natural' },
  { icon: ClipboardList, text: 'Guía de reportes' },
  { icon: Scale, text: 'Normativa SST' },
]

const MODULES = [
  { icon: AlertTriangle, title: 'Incidentes', tagline: 'FURAT automático', glowColor: 'rgba(239,68,68,0.35)' },
  { icon: BookOpen, title: 'Capacitaciones', tagline: 'Certificados en PDF', glowColor: 'rgba(59,130,246,0.35)' },
  { icon: Search, title: 'Auditorías', tagline: 'Cero hallazgos perdidos', glowColor: 'rgba(124,58,237,0.35)' },
  { icon: ShieldAlert, title: 'Riesgos', tagline: 'Matrices GTC-45', glowColor: 'rgba(250,204,21,0.35)' },
  { icon: LineChart, title: 'Dashboard', tagline: 'KPIs en tiempo real', glowColor: 'rgba(37,99,255,0.35)' },
  { icon: Bot, title: 'SASBOT', tagline: 'IA normativa 24/7', glowColor: 'rgba(168,85,247,0.35)' },
]

const BENEFICIARIES = [
  { icon: ShieldCheck, title: 'Encargado SST', badge: 'Gestión manual → Automatización total', color: '#3B82F6', featured: false, delay: 0.1 },
  { icon: BarChart3, title: 'Gerencia', badge: 'Dashboard en tiempo real', color: '#7C3AED', featured: true, delay: 0.3 },
  { icon: HardHat, title: 'Empleados', badge: 'Reporte inmediato', color: '#FBBF24', featured: false, delay: 0.1 },
]

const VIABILITY_METRICS = [
  { label: 'Pruebas Automáticas', value: 440, max: 440 },
  { label: 'Cobertura', value: 95, max: 100 },
  { label: 'Usuarios Activos', value: 4, max: 10 },
  { label: 'Módulos en Producción', value: 6, max: 6 },
  { label: 'Uptime', value: 99, max: 100 },
]

function interpolateStops(local, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
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
  { at: 0, x: 130, y: 0, opacity: 0 },
  { at: 0.12, x: 0, y: 0, opacity: 1 },
  { at: 0.35, x: 0, y: -70, opacity: 1 },
  { at: 0.65, x: -220, y: -30, opacity: 1 },
  { at: 1, x: 130, y: 0, opacity: 0 },
]

const LEFT_MASCOT_STOPS = [
  { at: 0, x: -130, y: 0, opacity: 0 },
  { at: 0.12, x: 0, y: 0, opacity: 1 },
  { at: 0.35, x: 0, y: -70, opacity: 1 },
  { at: 0.65, x: 220, y: -30, opacity: 1 },
  { at: 1, x: -130, y: 0, opacity: 0 },
]

function HeroChip({ label, color, icon: Icon, style, index }) {
  return (
    <motion.div
      className="hidden md:flex items-center gap-2 absolute px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm z-20"
      style={style}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span
        className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
        style={{ background: color }}
      >
        <Icon size={13} color="#05070D" strokeWidth={2.5} />
      </span>
      <span className="text-xs text-gray-300 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </motion.div>
  )
}

function SolutionCallout({ text, style, Arrow, arrowPosition }) {
  return (
    <div className="hidden md:block absolute z-20" style={style}>
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-full max-w-[180px]"
        style={{
          background: 'rgba(8,10,20,0.9)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)',
        }}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        {arrowPosition === 'start' && <Arrow size={16} color="#60A5FA" className="shrink-0" />}
        <span className="text-xs leading-snug" style={{ color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
          {text}
        </span>
        {arrowPosition === 'end' && <Arrow size={16} color="#60A5FA" className="shrink-0" />}
      </motion.div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
  const leftMascot = getMascotState(scrollProgress, 0.42, 0.7, LEFT_MASCOT_STOPS)

  const goToLogin = useCallback(() => navigate('/login'), [navigate])

  const handleNavClick = (href) => {
    setMobileMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="overflow-x-hidden" style={{ background: '#05070D', color: '#F8FAFC' }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 h-28 flex items-center justify-between px-6 md:px-10">
        <img src={pisstLogo} alt="Logo de PISST" className="w-28 h-28 object-contain" />

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm uppercase tracking-wide md:tracking-widest transition-colors duration-200"
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
          className="md:hidden fixed top-28 left-0 w-full z-40 flex flex-col px-6 py-4 gap-4"
          style={{ background: '#05070D' }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm uppercase tracking-wide text-left"
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

      {/* MASCOTA — se asoma por los bordes mientras se hace scroll */}
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

      {/* SECCIÓN 1 — HERO */}
      <section id="hero" className="relative z-0 min-h-screen overflow-hidden flex flex-col items-center justify-end px-6 pt-32 md:pt-36 pb-10 md:pb-14">
        <div className="absolute inset-0 -z-10">
          <img
            src={fondoLanding2}
            alt="Fondo PISST"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.35) 40%, rgba(5,7,13,0.9) 100%)',
            }}
          />
        </div>

        {HERO_CHIPS.map((chip, i) => (
          <HeroChip key={chip.label} {...chip} index={i} />
        ))}

        <div className="relative z-10 w-full text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-bold leading-none w-full"
            style={{
              fontSize: 'clamp(5.5rem, 23vw, 19rem)',
              fontFamily: "'Space Grotesk', sans-serif",
              backgroundImage:
                'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 30%, #60A5FA 65%, #1E3A8A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            PISST
          </motion.h1>

          <div className="max-w-xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base md:text-lg mt-2"
              style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
            >
              Digitaliza tu SG-SST. Cumple el Decreto 1072/2015 sin carpetas, sin Excel y sin estrés.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-wide md:tracking-widest rounded-full px-4 py-1.5 max-w-full mt-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8' }}
            >
              Plataforma SST con IA y Automatización · Colombia, 2026
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              onClick={goToLogin}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white mt-8 mx-auto"
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
              className="mt-6"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <ChevronDown size={22} className="mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2 — EL PROBLEMA */}
      <section id="problema" className="py-24 px-6 md:px-12 relative overflow-hidden" style={{ background: '#0A1020' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          <div className="flex-1 min-w-0">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
              className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.15] md:leading-[1.1]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Carpetas perdidas.
              <br />
              Excel desactualizado.
              <br />
              Accidentes que sí
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)' }}
              >
                pudieron evitarse.
              </span>
            </motion.h2>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
              className="text-base md:text-lg max-w-md mt-8"
              style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
            >
              Decreto 1072 de 2015. Obligatorio. La mayoría lo incumple sin querer.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="flex flex-col gap-3 md:gap-4 w-full md:w-auto"
          >
            {PROBLEM_CHIPS.map((chip) => (
              <motion.div
                key={chip.text}
                variants={fadeInUp}
                animate={isMobile ? undefined : { y: [0, -10, 0] }}
                transition={isMobile ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-2xl p-4 md:p-5 text-left md:text-center flex items-center md:flex-col gap-3 md:gap-0 min-w-0"
                style={{ background: '#121826', border: '1px solid #1e2a3a' }}
              >
                <chip.icon size={24} className="shrink-0 md:mx-auto md:mb-2" color="#A78BFA" />
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {chip.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="-mx-6 md:-mx-12 mt-10 md:mt-8 py-6 md:py-7"
          style={{
            background: 'linear-gradient(90deg, rgba(251,191,36,0.1), rgba(239,68,68,0.1))',
            borderTop: '1px solid rgba(251,191,36,0.25)',
            borderBottom: '1px solid rgba(251,191,36,0.25)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-wrap items-center justify-center gap-3 md:gap-5 text-center">
            <Banknote size={28} className="shrink-0" color="#FBBF24" />
            <p
              className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                backgroundImage: 'linear-gradient(90deg, #FBBF24 0%, #EF4444 100%)',
              }}
            >
              $<CountUpNumber end={500} duration={2} />M+
            </p>
            <p className="text-sm" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              en sanciones evitables al año
            </p>
          </div>
        </motion.div>
      </section>

      {/* SECCIÓN 3 — LA SOLUCIÓN */}
      <section id="solucion" className="min-h-screen py-24 px-6 md:px-12 flex items-center" style={{ background: '#05070D' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="relative flex-[1.5] w-full min-w-0">
            <DashboardMockup
              src={dashboardScreenshot}
              alt="Dashboard PISST"
              glowColor="rgba(37,99,255,0.2)"
            />
            {SOLUTION_FEATURES.map((feature) => (
              <SolutionCallout key={feature.text} {...feature} />
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="flex-1 w-full min-w-0 md:pl-6 lg:pl-10"
          >
            <motion.p
              variants={fadeInUp}
              className="flex items-center gap-2 text-xs uppercase tracking-wide md:tracking-widest mb-4"
              style={{ color: '#2563FF' }}
            >
              <Sparkles size={14} /> LA SOLUCIÓN
            </motion.p>

            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Todo tu SG-SST,
              <br />
              en una sola pantalla.
            </motion.h2>

            <motion.div variants={staggerContainer} className="md:hidden flex flex-col gap-3 mb-8">
              {SOLUTION_FEATURES.map((feature) => (
                <motion.div key={feature.text} variants={fadeInUp} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3B82F6' }} />
                  <span className="text-sm" style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 4 — SASBOT */}
      <section id="sasbot" className="min-h-screen py-24 px-6 md:px-12 flex items-center" style={{ background: '#0A1020' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse gap-12 items-center">
          <div className="flex-[1.5] w-full min-w-0">
            <DashboardMockup
              src={sasbotScreenshot}
              alt="Conversación con SASBOT"
              glowColor="rgba(124,58,237,0.2)"
            />
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="flex-1 w-full min-w-0"
          >
            <motion.p
              variants={fadeInUp}
              className="flex items-center gap-2 text-xs uppercase tracking-wide md:tracking-widest mb-4"
              style={{ color: '#7C3AED' }}
            >
              <Sparkles size={14} /> SASBOT — IA NORMATIVA
            </motion.p>

            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Pregúntale lo que sea
              <br />
              sobre SST.
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-sm md:text-base mb-8" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              Responde dudas normativas, guía reportes y está disponible para cualquier
              empleado, sin entrenamiento previo.
            </motion.p>

            <motion.div variants={staggerContainer} className="flex flex-wrap gap-3">
              {SASBOT_CHIPS.map((chip) => (
                <motion.div
                  key={chip.text}
                  variants={fadeInUp}
                  className="flex items-center gap-2 rounded-full px-4 py-2"
                  style={{ background: '#121826', border: '1px solid #1e2a3a' }}
                >
                  <chip.icon size={16} color="#A78BFA" />
                  <span className="text-xs" style={{ color: '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
                    {chip.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 5 — MÓDULOS */}
      <section id="modulos" className="py-24 px-6 md:px-12 text-center" style={{ background: '#05070D' }}>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="text-4xl md:text-7xl font-bold mb-16"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Seis módulos.
          <br />
          Una plataforma.
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {MODULES.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </motion.div>
      </section>

      {/* SECCIÓN 6 — BENEFICIARIOS */}
      <section className="py-24 px-6 md:px-12" style={{ background: '#0A1020' }}>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="text-4xl md:text-6xl font-bold text-center mb-16"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Beneficiarios
        </motion.h2>

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center">
          {BENEFICIARIES.map((b) => (
            <BeneficiaryCard key={b.title} {...b} featured={isMobile ? false : b.featured} />
          ))}
        </div>
      </section>

      {/* SECCIÓN 7 — VIABILIDAD TÉCNICA */}
      <section className="py-24 px-6 md:px-12" style={{ background: '#0A1020' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex-1 min-w-0"
          >
            <h2
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Viabilidad
              <br />
              Técnica
            </h2>
            <div className="mt-8">
              <p
                className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  backgroundImage: 'linear-gradient(90deg, #2563FF 0%, #7C3AED 100%)',
                }}
              >
                +95%
              </p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                Cobertura de Pruebas
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex-1 relative min-w-0"
          >
            <div className="absolute -inset-8 blur-3xl -z-10" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <div className="rounded-t-xl aspect-video overflow-hidden bg-black border border-white/10 max-w-full">
              <img
                src={dashboardScreenshot}
                alt="Mockup del dashboard PISST"
                className="w-full h-auto max-w-full object-cover"
              />
            </div>
            <div className="h-3 rounded-b-xl bg-[#1e2a3a]" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="flex-1 min-w-0"
          >
            <motion.p variants={fadeInUp} className="text-sm mb-8" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              Sistema desplegado en producción activa, con usuarios reales.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex items-end justify-between gap-2 h-40 mt-4">
              {VIABILITY_METRICS.map((m, i) => (
                <AnimatedBar key={m.label} {...m} delay={i * 0.1} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 8 — BURBUJA + CTA FINAL (fusionadas) */}
      <section
        className="relative min-h-[80vh] py-20 px-6 md:px-12 flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1020 0%, #1a0a3a 50%, #0A1020 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16 w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex-[1.2] text-center md:text-left min-w-0"
          >
            <h2
              className="text-4xl md:text-6xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              ¿Listo para
              <br />
              proteger a tu equipo?
            </h2>

            <p className="text-sm md:text-base mt-4" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              Únete a las empresas que ya gestionan su SG-SST con PISST.
            </p>

            <button
              onClick={goToLogin}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-lg font-bold mt-8 transition-colors duration-200"
              style={{ background: '#FBBF24', color: '#05070D' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FDE047')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FBBF24')}
            >
              INICIAR SESIÓN <ArrowRight size={20} />
            </button>

            <p className="text-xs mt-3" style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
              No necesitas tarjeta de crédito.
            </p>
          </motion.div>

          <div className="flex-1 flex justify-center w-full min-w-0">
            <Suspense fallback={null}>
              <InteractiveBubble />
            </Suspense>
          </div>
        </div>
      </section>

      {/* SECCIÓN 9 — FOOTER */}
      <footer className="py-12 px-8" style={{ background: '#030508', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={pisstLogo} alt="Logo de PISST" className="w-28 h-28 object-contain" />
          <p className="text-xs" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
            © 2026 PISST. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
