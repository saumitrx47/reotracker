import { userById } from '../data/users'
import { useActivityLog } from '../hooks/useProjectData'
import { dateTime } from '../lib/format'
import Modal from './Modal'

/** Audit trail of every write — who, in which role, and what changed. */
export default function ActivityLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const log = useActivityLog()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Activity log"
      subtitle={`${log.length} recorded action${log.length === 1 ? '' : 's'} · every change is retained with user, role and before → after values`}
      width="max-w-5xl"
    >
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[820px]">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="th">Time</th>
              <th className="th">User</th>
              <th className="th">Role</th>
              <th className="th">Action</th>
              <th className="th">Target</th>
              <th className="th">Before → after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {log.map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="td whitespace-nowrap text-xs text-slate-500">{dateTime(entry.at)}</td>
                <td className="td whitespace-nowrap font-medium text-slate-900">{userById(entry.userId).name}</td>
                <td className="td whitespace-nowrap text-xs text-slate-600">{entry.role}</td>
                <td className="td whitespace-nowrap">{entry.action}</td>
                <td className="td whitespace-nowrap font-mono text-xs text-slate-600">{entry.target}</td>
                <td className="td text-xs">
                  <span className="text-slate-500">{entry.before}</span>
                  <span className="mx-1.5 text-hazard-600" aria-label="changed to">→</span>
                  <span className="font-medium text-slate-800">{entry.after}</span>
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-sm text-slate-500" colSpan={6}>
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
