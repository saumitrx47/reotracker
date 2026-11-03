import { NavLink } from 'react-router-dom'
import { CalendarRange, GaugeCircle, Scale, Truck } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: GaugeCircle, end: true },
  { to: '/deliveries', label: 'Deliveries', icon: Truck, end: false },
  { to: '/reconciliation', label: 'Reconciliation', icon: Scale, end: false },
  { to: '/forecast', label: 'Forecast', icon: CalendarRange, end: false },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-ink-900 text-slate-300 md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="hazard-stripe h-9 w-9 shrink-0 rounded-md" aria-hidden />
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-white">
            Mat<span className="text-[#E8762D]">Trak</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-hazard-400">Reinforcing steel</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 px-3" aria-label="Primary">
        <ul className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-800 text-white'
                      : 'text-slate-400 hover:bg-ink-800/60 hover:text-slate-100',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={[
                        'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r',
                        isActive ? 'bg-hazard-400' : 'bg-transparent',
                      ].join(' ')}
                    />
                    <Icon size={18} strokeWidth={2} className={isActive ? 'text-hazard-400' : ''} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-ink-800 px-5 py-4 text-[11px] leading-relaxed text-slate-500">
        <div className="font-semibold text-slate-400">Demo build</div>
        Mock data only — no live BIM or ERP connection.
      </div>
    </aside>
  )
}
