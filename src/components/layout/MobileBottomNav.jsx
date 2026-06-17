import { Home, FileText, ShieldCheck, GraduationCap, ClipboardList, Users, User } from 'lucide-react'

const itemsSST = [
  { id: 'dashboard', label: 'Dashboard', Icon: Home },
  { id: 'reportes', label: 'Reportes', Icon: FileText },
  { id: 'evaluacion', label: 'Evaluación', Icon: ShieldCheck },
  { id: 'capacitaciones', label: 'Capacitaciones', Icon: GraduationCap },
  { id: 'auditorias', label: 'Auditorías', Icon: ClipboardList },
  { id: 'mas', label: 'Usuarios', Icon: Users },
]

const itemsGerencia = [
  { id: 'dashboard', label: 'Dashboard', Icon: Home },
  { id: 'reportes', label: 'Mis reportes', Icon: FileText },
  { id: 'perfil', label: 'Perfil', Icon: User },
]

export default function MobileBottomNav({ darkMode, active = 'dashboard', onChange, role }) {
  const items = role?.toString?.().toLowerCase?.() === 'gerencia' ? itemsGerencia : itemsSST
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-2 pb-[env(safe-area-inset-bottom)] border-t backdrop-blur"
      style={{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: darkMode ? '#1F2937' : '#E5E7EB',
      }}
    >
      <ul className="flex items-center justify-around">
        {items.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange?.(id)}
                title={label}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="w-full flex flex-col items-center gap-1 py-2 rounded-lg transition"
                style={{
                  color: isActive
                    ? '#6366F1'
                    : darkMode ? '#CBD5E1' : '#6B7280',
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {/* Labels SOLO en md+ (tablet en adelante) — en móvil no caben */}
                <span className="hidden sm:block text-[10px] font-medium leading-none">
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}