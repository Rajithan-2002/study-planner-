'use client'

import { useState, useTransition } from 'react'
import { Search, Filter, ArrowUpDown, Plus, Briefcase, Calendar, Clock, Edit3, Archive, RotateCcw, Trash2, ShieldAlert, CheckCircle2, AlertTriangle, Tag, Flame } from 'lucide-react'
import { ProjectModal } from './ProjectModal'
import { MilestoneManager } from './MilestoneManager'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'
import { QuickAddTask } from './quick-add-task'
import { archiveProject, restoreProject, deleteProject } from '@/app/actions/projects'
import { calculateProjectProgress, calculateProjectRiskAndHealth, getProjectAnalytics } from '@/lib/project/engine'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface ProjectHubViewProps {
  initialProjects: any[]
  initialTasks: any[]
  initialMilestones: any[]
  domains: any[]
}

export function ProjectHubView({
  initialProjects,
  initialTasks,
  initialMilestones,
  domains
}: ProjectHubViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'updated' | 'deadline' | 'priority' | 'progress' | 'name'>('updated')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [modalState, setModalState] = useState<{ isOpen: boolean; editingProject?: any }>({ isOpen: false })
  const [isPending, startTransition] = useTransition()

  const analytics = getProjectAnalytics(initialProjects, initialTasks, initialMilestones)

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveProject(id)
    })
  }

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreProject(id)
    })
  }

  // Reusable confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    isDanger: boolean
    confirmText: string
    onConfirm: () => Promise<void> | void
    errorMsg: string | null
  }>({
    isOpen: false,
    title: '',
    description: '',
    isDanger: false,
    confirmText: 'Confirm',
    onConfirm: () => {},
    errorMsg: null
  })

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project Permanently',
      description: 'Are you sure you want to permanently delete this project? This will remove all associated milestones, templates, and logs.',
      isDanger: true,
      confirmText: 'Delete Project',
      errorMsg: null,
      onConfirm: async () => {
        try {
          await deleteProject(id)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        } catch (err: any) {
          setConfirmModal(prev => ({ ...prev, errorMsg: err.message || 'Delete failed.' }))
        }
      }
    })
  }

  // Filter projects
  let filtered = initialProjects.filter(p => {
    const isArchivedMatch = activeTab === 'archived' ? p.is_archived === true : p.is_archived !== true
    if (!isArchivedMatch) return false

    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false
    if (selectedPriority !== 'ALL' && p.priority !== selectedPriority) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = p.name?.toLowerCase().includes(q)
      const catMatch = p.category?.toLowerCase().includes(q)
      const tagMatch = p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))
      if (!nameMatch && !catMatch && !tagMatch) return false
    }

    return true
  })

  // Sort projects
  filtered.sort((a, b) => {
    if (sortBy === 'deadline') {
      const dateA = a.target_completion_date ? new Date(a.target_completion_date).getTime() : 9999999999999
      const dateB = b.target_completion_date ? new Date(b.target_completion_date).getTime() : 9999999999999
      return dateA - dateB
    }
    if (sortBy === 'progress') {
      const progA = calculateProjectProgress(a, initialTasks, initialMilestones)
      const progB = calculateProjectProgress(b, initialTasks, initialMilestones)
      return progB - progA
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'priority') {
      const weights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (weights[b.priority] || 0) - (weights[a.priority] || 0)
    }
    // Default: updated
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  })

  const priorityColors: Record<string, string> = {
    LOW: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    HIGH: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    CRITICAL: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20 md:pb-0">
      
      {/* HEADER & ANALYTICS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Project Hub
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Manage your active projects, milestone pipelines, and focus schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalState({ isOpen: true })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Projects</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{analytics.activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Avg Progress</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{analytics.averageProgress}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Daily Focus
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{analytics.totalDailyFocusMins} <span className="text-xs font-bold text-slate-400">mins/day</span></p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Attention Needed</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{analytics.overdueCount}</p>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH, TABS & FILTERS */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Active vs Archived Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Projects ({analytics.activeCount})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Archived ({analytics.archivedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 pl-10 pr-4 py-2 text-xs font-semibold focus:border-blue-500 outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IDEA">Idea</option>
            <option value="RESEARCHING">Researching</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="updated">Recently Updated</option>
            <option value="deadline">Target Completion Date</option>
            <option value="progress">Progress %</option>
            <option value="priority">Priority</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
            {activeTab === 'archived' ? 'No archived projects found.' : 'No projects match your current search/filters.'}
          </div>
        ) : (
          filtered.map(project => {
            const projTasks = initialTasks.filter(t => t.related_entity_type === 'PROJECT' && t.related_entity_id === project.id)
            const projMilestones = initialMilestones.filter(m => m.project_id === project.id)
            const progress = calculateProjectProgress(project, initialTasks, initialMilestones)
            const { health, risk } = calculateProjectRiskAndHealth(project, initialTasks, initialMilestones)

            return (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {project.category && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {project.category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${priorityColors[project.priority] || priorityColors.LOW}`}>
                          {project.priority}
                        </span>
                        {risk === 'HIGH' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                            <ShieldAlert className="h-3 w-3" /> High Risk
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                        {project.name}
                      </h3>
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModalState({ isOpen: true, editingProject: project })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {project.is_archived ? (
                        <button
                          onClick={() => handleRestore(project.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                          title="Restore Project"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(project.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors cursor-pointer"
                          title="Archive Project"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={isPending}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* DYNAMIC PROGRESS BAR */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Completion</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* SCHEDULING & FOCUS MODEL */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl mb-4">
                    {project.daily_focus_minutes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>{project.daily_focus_minutes}m daily focus</span>
                      </div>
                    )}
                    {project.target_completion_date && (
                      <div className="flex items-center gap-1.5 col-span-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>{new Date(project.target_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* TAGS */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {project.tags.map((t: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* TASKS LIST */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Tasks ({projTasks.length})</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {projTasks.map(t => (
                        <TaskCheckbox key={t.id} taskId={t.id} title={t.title} status={t.status} />
                      ))}
                    </div>
                    <QuickAddTask relatedEntityType="PROJECT" relatedEntityId={project.id} />
                  </div>

                  {/* MILESTONE MANAGER INTEGRATION */}
                  <MilestoneManager projectId={project.id} tasks={projTasks} />
                </div>
              </div>
            )
          })
        )}
      </div>

      <ProjectModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        domains={domains || []}
        editingProject={modalState.editingProject}
      />

      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
        isLoading={isPending}
        errorMsg={confirmModal.errorMsg}
      />
    </div>
  )
}
