'use client'

import { useState, useTransition } from 'react'
import { Award, Calendar, ExternalLink, FileText, Trash2, BookOpen, Clock, Flame, ShieldAlert, Archive, RefreshCw, Plus, Search, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import { deleteCertification, archiveCertification, restoreCertification } from '@/app/actions/certifications'
import { calculateCertificationProgress, calculateExamReadiness, calculateDailyStudyRequirement } from '@/lib/certification/engine'
import { CertModal } from './CertModal'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { TopicManager } from './TopicManager'
import { TaskCheckbox } from '../ui/TaskCheckbox'
import { QuickAddTask } from '../projects/quick-add-task'

interface CertHubViewProps {
  certs: any[]
  topics: any[]
  subtopics: any[]
  sessions: any[]
  domains: any[]
  tasks: any[]
}

export function CertHubView({ certs = [], topics = [], subtopics = [], sessions = [], domains = [], tasks = [] }: CertHubViewProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [expandedCertId, setExpandedCertId] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<any>(null)
  
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

  // Filter based on tab & query
  const filteredCerts = certs.filter(c => {
    const matchesTab = activeTab === 'active' ? !c.is_archived : !!c.is_archived
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.provider && c.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDomain = selectedDomain === 'ALL' || c.domain_id === selectedDomain
    const matchesPriority = selectedPriority === 'ALL' || c.priority === selectedPriority

    return matchesTab && matchesSearch && matchesDomain && matchesPriority
  })

  const priorityColors: Record<string, string> = {
    LOW: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    HIGH: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    CRITICAL: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
  }

  const statusColors: Record<string, string> = {
    IDEA: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    ACTIVE: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    COMPLETED: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
    ARCHIVED: 'text-slate-400 bg-slate-100 border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800/80',
  }

  // Calculate Header Metrics using engine functions
  let totalStudyHrs = 0
  sessions.forEach(s => totalStudyHrs += s.duration_minutes / 60)

  const activeCerts = certs.filter(c => !c.is_archived && c.status !== 'COMPLETED')
  const completedCerts = certs.filter(c => c.status === 'COMPLETED')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Learning Journeys
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Design learning blueprints, track study session velocity, and prepare for professional exams.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCert(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Certification Track
        </button>
      </div>

      {/* METRICS HEADERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active tracks', val: activeCerts.length, sub: 'Study prep in-progress', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Study Velocity', val: `${Math.round(totalStudyHrs * 10) / 10}h`, sub: 'Total time logged', color: 'text-amber-500' },
          { label: 'Completed certificates', val: completedCerts.length, sub: 'Passed & finalized', color: 'text-emerald-500' },
          { label: 'Obsidian/Knowledge links', val: sessions.length, sub: 'Log sessions tracked', color: 'text-indigo-500' }
        ].map((m, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</span>
            <div className={`text-2xl font-black mt-1 ${m.color}`}>{m.val}</div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* SEARCH / FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search credentials, providers, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 outline-none dark:text-white focus:border-emerald-500"
          />
        </div>

        {/* Filter select inputs */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
            className="bg-white dark:bg-slate-900 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none dark:text-white cursor-pointer"
          >
            <option value="ALL">All Domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="bg-white dark:bg-slate-900 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none dark:text-white cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* TABS TRAY */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Active Credentials ({certs.filter(c => !c.is_archived).length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Archived Archives ({certs.filter(c => c.is_archived).length})
        </button>
      </div>

      {/* TRACKS LIST */}
      <div className="space-y-6">
        {filteredCerts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-semibold bg-white dark:bg-slate-900">
            No certifications found in this shelf.
          </div>
        ) : (
          filteredCerts.map(cert => {
            const certTopics = topics.filter(t => t.certification_id === cert.id)
            const certSubtopics = subtopics.filter(s => certTopics.some(t => t.id === s.topic_id))
            const certSessions = sessions.filter(s => s.certification_id === cert.id)

            // Dynamic progress & readiness calculations from engine
            const progress = calculateCertificationProgress(cert, topics, subtopics)
            const readiness = calculateExamReadiness(cert, topics, subtopics, sessions)
            const scheduling = calculateDailyStudyRequirement(cert, topics, subtopics)

            const totalPrepTasks = tasks.filter(t => t.related_entity_type === 'CERTIFICATION' && t.related_entity_id === cert.id)
            const completedPrepTasks = totalPrepTasks.filter(t => t.status === 'COMPLETED').length

            let countdownText = ''
            if (cert.exam_date) {
              const days = Math.ceil((new Date(cert.exam_date).getTime() - new Date().getTime()) / 86400000)
              countdownText = days < 0 ? 'Exam Overdue' : days === 0 ? 'Exam Today!' : `Exam in ${days} days`
            } else if (cert.target_date) {
              const days = Math.ceil((new Date(cert.target_date).getTime() - new Date().getTime()) / 86400000)
              countdownText = days < 0 ? 'Target Overdue' : days === 0 ? 'Target Today!' : `Target in ${days} days`
            }

            const isExpanded = expandedCertId === cert.id

            return (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300"
              >
                {/* HEAD & INFO GRID */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {cert.provider && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {cert.provider}
                        </span>
                      )}
                      {cert.cost > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          • Cost: ${cert.cost}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">{cert.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusColors[cert.status || 'ACTIVE']}`}>
                      {cert.status}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityColors[cert.priority || 'LOW']}`}>
                      {cert.priority}
                    </span>
                  </div>
                </div>

                {/* DATES BAR */}
                <div className="mt-4 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span>
                      {cert.exam_date
                        ? `Exam: ${new Date(cert.exam_date).toLocaleDateString()}`
                        : cert.target_date
                          ? `Target: ${new Date(cert.target_date).toLocaleDateString()}`
                          : 'No target exam date set'}
                    </span>
                  </div>
                  {countdownText && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      countdownText.includes('Today') || countdownText.includes('Overdue')
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                    }`}>
                      {countdownText}
                    </span>
                  )}
                </div>

                {/* PROGRESS METRICS ROW */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Learning Progress</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Readiness Indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Exam Readiness</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{readiness.score}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{readiness.label}</span>
                      <span className="text-[10px] text-slate-400">({certTopics.filter(t => t.learning_status === 'MASTERED').length} / {certTopics.length} Mastered)</span>
                    </div>
                  </div>

                  {/* Daily Focus Time */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Daily Study Goal</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" /> {scheduling.recommendedDailyMins} minutes study required
                    </span>
                  </div>

                </div>

                {/* PREPARATION TASK LIST */}
                <div className="mt-6 space-y-2 border-t border-slate-150 dark:border-slate-800/40 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Preparation checklist ({completedPrepTasks}/{totalPrepTasks.length})</span>
                  {totalPrepTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No prep tasks created. Add one below!</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {totalPrepTasks.map(t => (
                        <TaskCheckbox key={t.id} taskId={t.id} title={t.title} status={t.status} />
                      ))}
                    </div>
                  )}
                  
                  {/* Task Adder */}
                  <div className="mt-3">
                    <QuickAddTask
                      relatedEntityType="CERTIFICATION"
                      relatedEntityId={cert.id}
                      domainId={cert.domain_id}
                    />
                  </div>
                </div>

                {/* EXPAND BLUEPRINT & TOPICS TOGGLE */}
                <div className="mt-6 flex justify-between items-center border-t border-slate-150 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => setExpandedCertId(isExpanded ? null : cert.id)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>Hide Exam Domains & Blueprint <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>Expand Exam Domains & Blueprint ({certTopics.length} Topics) <ChevronDown className="h-4 w-4" /></>
                    )}
                  </button>

                  {/* Actions Tray */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCert(cert)
                        setIsModalOpen(true)
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Certification"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {activeTab === 'active' ? (
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            await archiveCertification(cert.id)
                          })
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Archive Certification"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            await restoreCertification(cert.id)
                          })
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Restore Certification"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Certification Track',
                          description: 'Are you sure you want to permanently delete this certification track? This will remove all associated exam blueprint structures, topics, subtopics, and study sessions.',
                          isDanger: true,
                          confirmText: 'Delete Track',
                          errorMsg: null,
                          onConfirm: async () => {
                            try {
                              await deleteCertification(cert.id)
                              setConfirmModal(prev => ({ ...prev, isOpen: false }))
                            } catch (err: any) {
                              setConfirmModal(prev => ({ ...prev, errorMsg: err.message || 'Delete failed.' }))
                            }
                          }
                        })
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Certification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* EXPANDED BLUEPRINT TOPIC WORKSPACE */}
                {isExpanded && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <TopicManager
                      certId={cert.id}
                      topics={topics}
                      subtopics={subtopics}
                      sessions={sessions}
                    />
                  </div>
                )}

              </div>
            )
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <CertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCert(null)
        }}
        domains={domains}
        editingCert={editingCert}
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
