'use client'

import { useCallback, useState, useTransition, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Loader2, Calendar, Flag } from 'lucide-react'
import { getProjectMilestones, createMilestone, toggleMilestoneStatus, deleteMilestone } from '@/app/actions/milestones'
import { calculateMilestoneProgress } from '@/lib/project/engine'

interface MilestoneManagerProps {
  projectId: string
  tasks?: any[]
}

export function MilestoneManager({ projectId, tasks = [] }: MilestoneManagerProps) {
  const [milestones, setMilestones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true)
    const data = await getProjectMilestones(projectId)
    setMilestones(data || [])
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  const handleToggle = (milestoneId: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleMilestoneStatus(milestoneId, currentStatus)
      await fetchMilestones()
    })
  }

  const handleDelete = (milestoneId: string) => {
    startTransition(async () => {
      await deleteMilestone(milestoneId)
      await fetchMilestones()
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('project_id', projectId)
      fd.append('title', newTitle)
      if (newDueDate) fd.append('due_date', newDueDate)

      await createMilestone(fd)
      setNewTitle('')
      setNewDueDate('')
      setIsAdding(false)
      await fetchMilestones()
    })
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-blue-500" /> Milestones ({milestones.length})
        </h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Milestone
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            required
            autoFocus
            placeholder="Milestone title (e.g., API Integration)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
          />
          <div className="flex items-center justify-between gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="text-[11px] font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1.5 outline-none dark:text-white"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-2 text-center text-xs text-slate-400 font-medium">Loading milestones...</div>
      ) : milestones.length === 0 ? (
        <div className="py-2 text-center text-xs text-slate-400 italic">No milestones defined yet.</div>
      ) : (
        <div className="space-y-1.5">
          {milestones.map(m => {
            const isDone = m.status === 'COMPLETED'
            const milestoneTaskProgress = calculateMilestoneProgress(m.id, tasks)

            return (
              <div
                key={m.id}
                className="group/m flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <button
                    onClick={() => handleToggle(m.id, m.status)}
                    disabled={isPending}
                    className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span className={`font-bold truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {m.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.due_date && (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      <Calendar className="h-3 w-3" /> {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={isPending}
                    className="p-1 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover/m:opacity-100 transition-opacity cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
