import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useProject } from '../hooks/useProjectData'
import { dateTime } from '../lib/format'
import UserMenu from './UserMenu'
import NotificationsPopover from './NotificationsPopover'
import ActivityLogModal from './ActivityLogModal'

export default function TopBar() {
  const { data: project } = useProject()
  const [activityOpen, setActivityOpen] = useState(false)

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
          <NotificationsPopover onOpenActivity={() => setActivityOpen(true)} />
          <div className="h-6 w-px bg-slate-200" aria-hidden />
          <UserMenu onOpenActivity={() => setActivityOpen(true)} />
        </div>
      </div>
      <ActivityLogModal open={activityOpen} onClose={() => setActivityOpen(false)} />
    </header>
  )
}
