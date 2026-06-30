'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Clock, Flame, Tag, BookOpen, Star, AlertTriangle, Loader2 } from 'lucide-react'
import { createTopic, updateTopic, deleteTopic, createSubtopic, toggleSubtopicStatus, deleteSubtopic, logStudySession } from '@/app/actions/topics'

interface TopicManagerProps {
  certId: string
  topics: any[]
  subtopics: any[]
  sessions: any[]
}

export function TopicManager({ certId, topics = [], subtopics = [], sessions = [] }: TopicManagerProps) {
  const [activeDomain, setActiveDomain] = useState<string>('ALL')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [isAddingSubtopic, setIsAddingSubtopic] = useState(false)
  const [isLoggingSession, setIsLoggingSession] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states for creating a Topic
  const [newTopic, setNewTopic] = useState({
    title: '',
    domain_name: '',
    estimated_study_hours: 10,
    difficulty: 'MEDIUM',
    learning_status: 'NOT_STARTED',
    priority: 'MEDIUM',
    notes: '',
    tags: ''
  })

  // Form states for Subtopic & Study Session
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('')
  const [sessionMins, setSessionMins] = useState(30)
  const [sessionNotes, setSessionNotes] = useState('')

  // Filter topics
  const certTopics = topics.filter(t => t.certification_id === certId)
  
  // Extract unique domains
  const domains = Array.from(new Set(certTopics.map(t => t.domain_name).filter(Boolean))) as string[]

  const filteredTopics = certTopics.filter(t => {
    if (activeDomain === 'ALL') return true
    return t.domain_name === activeDomain
  })

  const selectedTopic = certTopics.find(t => t.id === selectedTopicId)

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopic.title.trim()) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('certification_id', certId)
      fd.append('title', newTopic.title)
      if (newTopic.domain_name) fd.append('domain_name', newTopic.domain_name)
      fd.append('estimated_study_hours', String(newTopic.estimated_study_hours))
      fd.append('difficulty', newTopic.difficulty)
      fd.append('learning_status', newTopic.learning_status)
      fd.append('priority', newTopic.priority)
      if (newTopic.notes) fd.append('notes', newTopic.notes)
      if (newTopic.tags) fd.append('tags', newTopic.tags)

      const res = await createTopic(fd)
      if (res && res.success) {
        setIsAddingTopic(false)
        setNewTopic({
          title: '',
          domain_name: '',
          estimated_study_hours: 10,
          difficulty: 'MEDIUM',
          learning_status: 'NOT_STARTED',
          priority: 'MEDIUM',
          notes: '',
          tags: ''
        })
      }
    })
  }

  const handleUpdateStatus = (topicId: string, status: string) => {
    startTransition(async () => {
      const target = certTopics.find(t => t.id === topicId)
      if (!target) return

      const fd = new FormData()
      fd.append('topic_id', topicId)
      fd.append('title', target.title)
      fd.append('learning_status', status)
      fd.append('difficulty', target.difficulty)
      fd.append('priority', target.priority)
      fd.append('estimated_study_hours', String(target.estimated_study_hours))
      fd.append('confidence_level', String(target.confidence_level))

      await updateTopic(fd)
    })
  }

  const handleUpdateConfidence = (topicId: string, level: number) => {
    startTransition(async () => {
      const target = certTopics.find(t => t.id === topicId)
      if (!target) return

      const fd = new FormData()
      fd.append('topic_id', topicId)
      fd.append('title', target.title)
      fd.append('confidence_level', String(level))
      fd.append('learning_status', target.learning_status)
      fd.append('difficulty', target.difficulty)
      fd.append('priority', target.priority)
      fd.append('estimated_study_hours', String(target.estimated_study_hours))

      await updateTopic(fd)
    })
  }

  const handleDeleteTopic = (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return
    startTransition(async () => {
      await deleteTopic(topicId)
      if (selectedTopicId === topicId) setSelectedTopicId(null)
    })
  }

  // Subtopic Handlers
  const handleCreateSubtopic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTopicId || !newSubtopicTitle.trim()) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('topic_id', selectedTopicId)
      fd.append('title', newSubtopicTitle)
      const res = await createSubtopic(fd)
      if (res && res.success) {
        setNewSubtopicTitle('')
        setIsAddingSubtopic(false)
      }
    })
  }

  const handleToggleSubtopic = (subtopicId: string, status: string) => {
    startTransition(async () => {
      await toggleSubtopicStatus(subtopicId, status)
    })
  }

  const handleDeleteSubtopic = (subtopicId: string) => {
    startTransition(async () => {
      await deleteSubtopic(subtopicId)
    })
  }

  // Study Session Handlers
  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (sessionMins <= 0) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('certification_id', certId)
      if (selectedTopicId) fd.append('topic_id', selectedTopicId)
      fd.append('duration_minutes', String(sessionMins))
      if (sessionNotes) fd.append('notes', sessionNotes)

      const res = await logStudySession(fd)
      if (res && res.success) {
        setSessionMins(30)
        setSessionNotes('')
        setIsLoggingSession(false)
      }
    })
  }

  const difficultyColors: Record<string, string> = {
    EASY: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
    MEDIUM: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    HARD: 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400'
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-6">
      
      {/* SECTION TABS: EXAM BLUEPRINTS */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveDomain('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeDomain === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Blueprint Domains
          </button>
          {domains.map((dom, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDomain(dom)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeDomain === dom
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {dom.split(':')[0] || dom}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddingTopic(!isAddingTopic)}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> Add Blueprint Topic
        </button>
      </div>

      {/* ADD TOPIC INLINE FORM */}
      {isAddingTopic && (
        <form onSubmit={handleCreateTopic} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Topic Title</label>
              <input
                type="text"
                required
                placeholder="E.g., Subnetting Fundamentals"
                value={newTopic.title}
                onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Exam Domain (Blueprint)</label>
              <input
                type="text"
                placeholder="E.g., Domain 1: Network Fundamentals"
                value={newTopic.domain_name}
                onChange={e => setNewTopic({ ...newTopic, domain_name: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Difficulty</label>
              <select
                value={newTopic.difficulty}
                onChange={e => setNewTopic({ ...newTopic, difficulty: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              >
                <option value="EASY">EASY (1.0x)</option>
                <option value="MEDIUM">MEDIUM (1.5x)</option>
                <option value="HARD">HARD (2.0x)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
              <select
                value={newTopic.learning_status}
                onChange={e => setNewTopic({ ...newTopic, learning_status: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="READING">Reading</option>
                <option value="PRACTICING">Practicing</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="MASTERED">Mastered</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Est. Hours</label>
              <input
                type="number"
                min="0"
                value={newTopic.estimated_study_hours}
                onChange={e => setNewTopic({ ...newTopic, estimated_study_hours: Number(e.target.value) })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tags (Comma Sep)</label>
              <input
                type="text"
                placeholder="dns, vpc"
                value={newTopic.tags}
                onChange={e => setNewTopic({ ...newTopic, tags: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTopic(false)}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Topic'}
            </button>
          </div>
        </form>
      )}

      {/* TOPICS & DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOPICS LIST */}
        <div className="col-span-1 border-r border-slate-100 dark:border-slate-800/80 pr-6 space-y-2 max-h-[45vh] overflow-y-auto scrollbar-thin">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Blueprint Topics ({filteredTopics.length})</p>
          {filteredTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No topics found for this section.</p>
          ) : (
            filteredTopics.map(t => {
              const isActive = selectedTopicId === t.id
              const subList = subtopics.filter(s => s.topic_id === t.id)
              const completedSubs = subList.filter(s => s.status === 'COMPLETED').length
              const totalSubs = subList.length

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{t.title}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${difficultyColors[t.difficulty] || difficultyColors.MEDIUM}`}>
                      {t.difficulty}
                    </span>
                  </div>
                  
                  {t.domain_name && (
                    <span className="text-[9px] font-extrabold text-slate-400 truncate">
                      {t.domain_name.split(':')[0] || t.domain_name}
                    </span>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/30">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{t.learning_status.replace('_', ' ')}</span>
                    {totalSubs > 0 && (
                      <span>{completedSubs}/{totalSubs} steps</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* TOPIC DETAILS WORKSPACE */}
        <div className="col-span-2 space-y-4">
          {selectedTopic ? (
            <div className="space-y-4">
              
              {/* TOPIC HEADER */}
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedTopic.title}</h4>
                  {selectedTopic.domain_name && (
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{selectedTopic.domain_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteTopic(selectedTopic.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                    title="Delete Topic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ESTIMATES, WORKLOAD, STATUS DROPDOWNS */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Est. Hours</span>
                  <span className="text-slate-900 dark:text-white font-bold">{selectedTopic.estimated_study_hours || 0} hrs</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Confidence</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => {
                      const active = star <= (selectedTopic.confidence_level || 3)
                      return (
                        <Star
                          key={star}
                          onClick={() => handleUpdateConfidence(selectedTopic.id, star)}
                          className={`h-3.5 w-3.5 cursor-pointer transition-colors ${
                            active ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                  <select
                    value={selectedTopic.learning_status}
                    onChange={e => handleUpdateStatus(selectedTopic.id, e.target.value)}
                    className="bg-transparent font-bold text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer text-xs"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="READING">Reading</option>
                    <option value="PRACTICING">Practicing</option>
                    <option value="REVIEWING">Reviewing</option>
                    <option value="MASTERED">Mastered</option>
                  </select>
                </div>
              </div>

              {/* SUBTOPICS CHECKLIST */}
              <div className="space-y-3 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Subtopic checklist</h5>
                  <button
                    onClick={() => setIsAddingSubtopic(!isAddingSubtopic)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Step
                  </button>
                </div>

                {isAddingSubtopic && (
                  <form onSubmit={handleCreateSubtopic} className="flex gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="E.g., Complete chapter 4 review questions"
                      value={newSubtopicTitle}
                      onChange={e => setNewSubtopicTitle(e.target.value)}
                      className="flex-1 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                    />
                    <button type="submit" className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer">
                      Add
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {subtopics.filter(s => s.topic_id === selectedTopic.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No checklist items defined yet.</p>
                  ) : (
                    subtopics
                      .filter(s => s.topic_id === selectedTopic.id)
                      .map(sub => {
                        const isDone = sub.status === 'COMPLETED'
                        return (
                          <div key={sub.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                onClick={() => handleToggleSubtopic(sub.id, sub.status)}
                                className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              >
                                {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : <Circle className="h-4 w-4" />}
                              </button>
                              <span className={`font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {sub.title}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteSubtopic(sub.id)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>

              {/* WORKLOAD SESSIONS LOGGER */}
              <div className="space-y-3 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" /> Study Session Time Logs
                  </h5>
                  <button
                    onClick={() => setIsLoggingSession(!isLoggingSession)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Log Study time
                  </button>
                </div>

                {isLoggingSession && (
                  <form onSubmit={handleLogSession} className="space-y-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Duration (mins)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={sessionMins}
                          onChange={e => setSessionMins(Number(e.target.value))}
                          className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Session Highlights</label>
                        <input
                          type="text"
                          placeholder="What did you study?"
                          value={sessionNotes}
                          onChange={e => setSessionNotes(e.target.value)}
                          className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setIsLoggingSession(false)} className="text-[11px] font-bold text-slate-500">Cancel</button>
                      <button type="submit" className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer">Log Session</button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs font-semibold">
                  {sessions.filter(s => s.topic_id === selectedTopic.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No study sessions logged for this topic.</p>
                  ) : (
                    sessions
                      .filter(s => s.topic_id === selectedTopic.id)
                      .map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{s.duration_minutes} mins studied</span>
                          <span className="text-slate-400 text-[10px]">{s.notes || 'No description notes'}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 italic">
              Select a blueprint topic to configure learning status, subtopics, and log study sessions.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
