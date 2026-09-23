import { Bell, ChevronDown, RefreshCw } from 'lucide-react'
import { useProject } from '../hooks/useProjectData'
import { dateTime } from '../lib/format'

export default function TopBar() {
  const { data: project } = useProject()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="hazard-stripe h-1" aria-hidden />
      <div className="flex items-center justify-between gap-4 px-6 py-3.5 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
            ReoTracker Demo — {project?.name ?? 'Project Site 12'}
          </h1>
          <p className="truncate text-xs text-slate-500">
            {project ? `${project.client} · ${project.location}` : 'Loading project…'}
            {project && (
              <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                <RefreshCw size={11} aria-hidden />
                Synced {dateTime(project.lastSyncedAt)}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button type="button" className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
          </button>
          <div className="h-6 w-px bg-slate-200" aria-hidden />
          <button type="button" className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-hazard-400">
              {project?.user.initials ?? 'PN'}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-slate-800">{project?.user.name ?? 'Priya Naidu'}</span>
              <span className="block text-[11px] text-slate-500">{project?.user.role ?? 'Quantity Surveyor'}</span>
            </span>
            <ChevronDown size={14} className="text-slate-400" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}
