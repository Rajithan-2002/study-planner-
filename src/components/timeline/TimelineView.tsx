'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Flag,
  Trash2,
  Calendar as CalendarIcon,
  Award,
  FileText,
  Trophy,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  List,
  Info,
  Clock,
  Sparkles,
  X,
  Plus,
  Loader2
} from 'lucide-react'
import { deleteLifeEvent } from '@/app/actions/life-events'
import { KELANIYA_ACADEMIC_CALENDAR_2024_2025, UniversityCalendarEvent } from '@/lib/academic/calendar-data'
import { createTaskDirect } from '@/app/actions/tasks'

interface LifeEvent {
  id: string
  title: string
  type: string
  event_date: string
  importance?: number
}

interface Task {
  id: string
  title: string
  description?: string | null
  due_date: string
  priority: string
  status: string
}

interface TimelineViewProps {
  initialEvents: LifeEvent[]
  initialTasks?: Task[]
}

const typeStyles: Record<string, { icon: any, color: string, bg: string, dot: string }> = {
  EXAM: { icon: CalendarIcon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20', dot: 'bg-red-500' },
  CERT_EXAM: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  PROJECT_MILESTONE: { icon: Flag, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20', dot: 'bg-indigo-500' },
  ASSIGNMENT: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20', dot: 'bg-orange-500' },
  COMPETITION: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', dot: 'bg-amber-500' },
  INTERNSHIP_DEADLINE: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', dot: 'bg-blue-500' },
}

const academicCategoryStyles: Record<string, { color: string, bg: string, border: string, dot: string, label: string }> = {
  ORIENTATION: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/30', dot: 'bg-blue-500', label: 'Orientation' },
  ACADEMIC: { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-900/30', dot: 'bg-indigo-500', label: 'Academic Activities' },
  LEAVE: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/30', dot: 'bg-amber-500', label: 'Preparation Leave' },
  EXAM: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/30', dot: 'bg-red-500', label: 'Final Exams' },
  VACATION: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/30', dot: 'bg-emerald-500', label: 'Vacation Break' },
  INTERNSHIP: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-900/30', dot: 'bg-purple-500', label: 'Industrial Internship' },
}

export function TimelineView({ initialEvents, initialTasks = [] }: TimelineViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [activeTab, setActiveTab] = useState<'deadlines' | 'university'>('deadlines')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<UniversityCalendarEvent | null>(null)

  // Task creation state
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    dueDate: string
    priority: string
    errorMsg: string | null
  }>({
    isOpen: false,
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    errorMsg: null
  })

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await createTaskDirect({
        title: taskModal.title,
        description: taskModal.description,
        priority: taskModal.priority,
        due_date: taskModal.dueDate
      })
      if (res && res.success) {
        setTaskModal(prev => ({ ...prev, isOpen: false }))
        router.refresh()
      } else {
        setTaskModal(prev => ({ ...prev, errorMsg: res?.error || 'Failed to create task.' }))
      }
    })
  }

  // Format date helper: YYYY-MM-DD local
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get active Kelaniya events for a date
  const getAcademicEventsForDate = (date: Date) => {
    const dateStr = getLocalDateString(date)
    return KELANIYA_ACADEMIC_CALENDAR_2024_2025.filter(
      event => dateStr >= event.startDate && dateStr <= event.endDate
    )
  }

  // Delete event handler
  const handleDelete = async (id: string) => {
    try {
      await deleteLifeEvent(id)
    } catch (e) {
      console.error(e)
    }
  }

  // Get start/end dates for calendar monthly grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Calendar days array
  const calendarDays: (Date | null)[] = []
  
  // Padding for start day of week
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null)
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d))
  }

  // Next/prev month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Categorize user events for LIST view
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const categorizedEvents = {
    past: [] as LifeEvent[],
    today: [] as LifeEvent[],
    thisWeek: [] as LifeEvent[],
    thisMonth: [] as LifeEvent[],
    upcoming: [] as LifeEvent[],
  }

  initialEvents.forEach(e => {
    const eDate = new Date(e.event_date)
    if (eDate < startOfToday) {
      categorizedEvents.past.push(e)
    } else if (eDate >= startOfToday && eDate < endOfToday) {
      categorizedEvents.today.push(e)
    } else if (eDate >= endOfToday && eDate < endOfWeek) {
      categorizedEvents.thisWeek.push(e)
    } else if (eDate >= endOfWeek && eDate <= endOfMonth) {
      categorizedEvents.thisMonth.push(e)
    } else {
      categorizedEvents.upcoming.push(e)
    }
  })

  // Get user events + academic events on selected date
  const eventsOnSelectedDate = selectedDate
    ? initialEvents.filter(e => {
        const d = new Date(e.event_date)
        return d.toDateString() === selectedDate.toDateString()
      })
    : []

  const tasksOnSelectedDate = selectedDate
    ? initialTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return d.toDateString() === selectedDate.toDateString()
      })
    : []

  const academicEventsOnSelectedDate = selectedDate
    ? getAcademicEventsForDate(selectedDate)
    : []

  const renderEventRow = (event: LifeEvent, isPast = false) => {
    const style = typeStyles[event.type] || { icon: CalendarDays, color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-500' }
    const Icon = style.icon
    const eventDate = new Date(event.event_date)

    return (
      <div
        key={event.id}
        className={`flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 ${
          isPast ? 'opacity-55' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${style.bg}`}>
            <Icon className={`h-5 w-5 ${style.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.title}
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-14 sm:ml-0">
          <span className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-800">
            {event.type.replace('_', ' ')}
          </span>
          
          <button
            onClick={() => handleDelete(event.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Calculate days remaining helper
  const getDaysRemainingText = (endDateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(endDateStr)
    end.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'Completed'
    } else if (diffDays === 0) {
      return 'Ends today!'
    } else {
      return `${diffDays} days remaining`
    }
  }

  return (
    <div className="space-y-6">
      {/* TOGGLES & TABS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 w-fit">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              view === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Timeline List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              view === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Calendar Grid
          </button>
        </div>


      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {activeTab === 'deadlines' ? (
            <>
              {initialEvents.length === 0 && (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
                  No timeline events tracked. Add assignments, certifications, or projects to map milestones.
                </div>
              )}

              {/* Today */}
              {categorizedEvents.today.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Today
                  </h3>
                  <div className="space-y-3">
                    {categorizedEvents.today.map(e => renderEventRow(e))}
                  </div>
                </div>
              )}

              {/* This Week */}
              {categorizedEvents.thisWeek.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">This Week</h3>
                  <div className="space-y-3">
                    {categorizedEvents.thisWeek.map(e => renderEventRow(e))}
                  </div>
                </div>
              )}

              {/* This Month */}
              {categorizedEvents.thisMonth.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-450 dark:text-slate-405 uppercase tracking-widest">Later This Month</h3>
                  <div className="space-y-3">
                    {categorizedEvents.thisMonth.map(e => renderEventRow(e))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {categorizedEvents.upcoming.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-450 dark:text-slate-405 uppercase tracking-widest">Future Events</h3>
                  <div className="space-y-3">
                    {categorizedEvents.upcoming.map(e => renderEventRow(e))}
                  </div>
                </div>
              )}

              {/* Past Events */}
              {categorizedEvents.past.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Past Events</h3>
                  <div className="space-y-3">
                    {categorizedEvents.past.map(e => renderEventRow(e, true))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // UNIVERSITY ACADEMIC CALENDAR LIST
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KELANIYA_ACADEMIC_CALENDAR_2024_2025.map((item) => {
                const style = academicCategoryStyles[item.category] || { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' }
                const isCurrent = getAcademicEventsForDate(new Date()).some(e => e.id === item.id)

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCalendarEvent(item)}
                    className={`p-5 rounded-2xl border-2 bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group ${
                      isCurrent ? 'border-purple-500 shadow-sm' : 'border-slate-100 dark:border-slate-800/80'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[8px] font-black rounded-md uppercase tracking-wider">
                        Active Period
                      </span>
                    )}

                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${style.bg} ${style.color} ${style.border} mb-3`}>
                      {style.label}
                    </span>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h4>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-105 dark:border-slate-800/80 text-[10px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1 font-bold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> {item.durationText}
                      </span>
                      <span>
                        {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* CALENDAR GRID */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Monthly Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/40 dark:bg-slate-950/20 rounded-xl border border-transparent" />

                const isToday = day.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === day.toDateString()
                
                // Get user deadlines on this day
                const dayEvents = initialEvents.filter(e => {
                  const d = new Date(e.event_date)
                  return d.toDateString() === day.toDateString()
                })

                // Get tasks on this day
                const dayTasks = initialTasks.filter(t => {
                  if (!t.due_date) return false
                  const d = new Date(t.due_date)
                  return d.toDateString() === day.toDateString()
                })

                // Get official academic calendar events on this day
                const dayAcademicEvents = getAcademicEventsForDate(day)
                const primaryAcademic = dayAcademicEvents[0]
                const acadStyle = primaryAcademic ? academicCategoryStyles[primaryAcademic.category] : null

                const hasActiveTasks = dayTasks.some(t => t.status !== 'COMPLETED')

                return (
                  <button
                    key={`day-${idx}`}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square relative rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans text-xs font-semibold ${
                      isSelected
                        ? 'bg-blue-650 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                        : isToday
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10'
                          : hasActiveTasks
                            ? 'border-amber-300 dark:border-amber-800 bg-amber-50/15 dark:bg-amber-950/5 text-slate-800 dark:text-slate-200'
                            : acadStyle
                              ? `bg-slate-50/60 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border-l-4 border-l-${primaryAcademic.category === 'ACADEMIC' ? 'indigo' : primaryAcademic.category === 'EXAM' ? 'red' : 'purple'}-500 border-slate-200 dark:border-slate-800`
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    
                    {/* User Event & Task dot indicators */}
                    {(dayEvents.length > 0 || dayTasks.length > 0) && (
                      <div className="absolute bottom-1.5 flex gap-1 justify-center max-w-full px-1">
                        {dayEvents.slice(0, 2).map((e, eIdx) => {
                          const style = typeStyles[e.type] || { dot: 'bg-slate-400' }
                          return (
                            <span
                              key={`ev-${eIdx}`}
                              className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                            />
                          )
                        })}
                        {dayTasks.slice(0, 2).map((t, tIdx) => {
                          const dotColor = t.priority === 'HIGH' ? 'bg-red-500' : t.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-400'
                          return (
                            <span
                              key={`t-${tIdx}`}
                              className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                            />
                          )
                        })}
                      </div>
                    )}

                    {/* Academic calendar bar indicator */}
                    {!isSelected && dayAcademicEvents.length > 0 && (
                      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${acadStyle?.dot || 'bg-purple-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* DATE DETAILS */}
          <div className="lg:col-span-1 flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs max-h-[500px]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
                : 'Select a Date'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
              {/* Official University Calendar Event Card (if active on selected date) */}
              {academicEventsOnSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-purple-650 dark:text-purple-400 uppercase tracking-widest">
                    Faculty Academic Calendar
                  </h4>
                  {academicEventsOnSelectedDate.map(event => {
                    const style = academicCategoryStyles[event.category] || { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' }
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedCalendarEvent(event)}
                        className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/20 dark:bg-purple-950/10 dark:border-purple-900/20 cursor-pointer hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${style.bg} ${style.color} ${style.border} mb-2`}>
                            {style.label}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {event.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-purple-100/50 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskModal({
                                isOpen: true,
                                title: `Study for: ${event.title}`,
                                description: `Preparation for ${event.title}. ${event.description || ''}`,
                                dueDate: selectedDate ? getLocalDateString(selectedDate) : '',
                                priority: 'HIGH',
                                errorMsg: null
                              })
                            }}
                            className="flex items-center gap-1 text-[9px] font-black uppercase text-purple-650 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" /> Add Task
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* User Deadlines */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  My Deadlines & Reminders
                </h4>

                {eventsOnSelectedDate.length === 0 && tasksOnSelectedDate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-600 text-center font-medium">
                    <CalendarIcon className="h-6 w-6 stroke-[1.5] mb-1.5 text-slate-350 dark:text-slate-700" />
                    <p className="text-[10px]">No specific tasks on this day.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Life Events */}
                    {eventsOnSelectedDate.map(e => {
                      const style = typeStyles[e.type] || { icon: CalendarDays, color: 'text-slate-500', bg: 'bg-slate-100' }
                      const Icon = style.icon
                      return (
                        <div
                          key={e.id}
                          className="p-3 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${style.bg}`}>
                              <Icon className={`h-4 w-4 ${style.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 line-clamp-2">
                                {e.title}
                              </h4>
                              <span className="inline-block text-[8px] font-black uppercase tracking-wider text-slate-450 mt-1">
                                {e.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-slate-200/50 dark:border-slate-850/50">
                            <button
                              onClick={() => {
                                setTaskModal({
                                  isOpen: true,
                                  title: `Work on: ${e.title}`,
                                  description: `Milestone tracking for ${e.title}`,
                                  dueDate: selectedDate ? getLocalDateString(selectedDate) : '',
                                  priority: 'MEDIUM',
                                  errorMsg: null
                                })
                              }}
                              className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-650 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Task
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {/* Tasks */}
                    {tasksOnSelectedDate.map(t => {
                      const priorityColor = t.priority === 'HIGH' ? 'text-red-650 bg-red-50 dark:bg-red-950/20' : t.priority === 'MEDIUM' ? 'text-amber-650 bg-amber-50 dark:bg-amber-950/20' : 'text-slate-500 bg-slate-50 dark:bg-slate-950/20'
                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col gap-2.5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-105 dark:bg-slate-950">
                              <CalendarIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs font-bold text-slate-850 dark:text-slate-200 line-clamp-2 ${t.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                                {t.title}
                              </h4>
                              {t.description && <p className="text-[10px] text-slate-450 truncate mt-0.5">{t.description}</p>}
                              <div className="flex gap-2 mt-1.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${priorityColor}`}>
                                  {t.priority}
                                </span>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-slate-550 bg-slate-100 dark:bg-slate-950">
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {selectedDate && (
                  <button
                    onClick={() => {
                      setTaskModal({
                        isOpen: true,
                        title: '',
                        description: '',
                        dueDate: getLocalDateString(selectedDate),
                        priority: 'MEDIUM',
                        errorMsg: null
                      })
                    }}
                    className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-blue-500" /> Add Custom Task to this Date
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* DETAILED INFORMATION MODAL FOR CALENDAR EVENTS */}
      {selectedCalendarEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedCalendarEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                (academicCategoryStyles[selectedCalendarEvent.category] || {}).bg
              } ${
                (academicCategoryStyles[selectedCalendarEvent.category] || {}).color
              } ${
                (academicCategoryStyles[selectedCalendarEvent.category] || {}).border
              }`}>
                {selectedCalendarEvent.category} PERIOD
              </span>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {selectedCalendarEvent.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                  {selectedCalendarEvent.description}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-slate-850 dark:text-slate-200 font-bold">{selectedCalendarEvent.durationText}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Start Date</span>
                  <span className="text-slate-850 dark:text-slate-200 font-bold">
                    {new Date(selectedCalendarEvent.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">End Date</span>
                  <span className="text-slate-850 dark:text-slate-200 font-bold">
                    {new Date(selectedCalendarEvent.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/40 p-3 rounded-2xl">
                  <span className="text-purple-650 dark:text-purple-400 font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4" /> Status
                  </span>
                  <span className="text-purple-650 dark:text-purple-400 font-extrabold uppercase text-[10px] tracking-wider">
                    {getDaysRemainingText(selectedCalendarEvent.endDate)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCalendarEvent(null)
                    setTaskModal({
                      isOpen: true,
                      title: `Study for: ${selectedCalendarEvent.title}`,
                      description: `Preparation for ${selectedCalendarEvent.title}. ${selectedCalendarEvent.description || ''}`,
                      dueDate: selectedCalendarEvent.startDate,
                      priority: 'HIGH',
                      errorMsg: null
                    })
                  }}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-purple-650 hover:bg-purple-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add Task for this Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {taskModal.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setTaskModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
              Add Task to Calendar
            </h3>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              {taskModal.errorMsg && (
                <div className="bg-red-50 text-red-650 p-3 rounded-xl text-xs font-semibold">
                  {taskModal.errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-450 dark:text-slate-500 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskModal.title}
                  onChange={(e) => setTaskModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Prepare for final exams"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-855 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-450 dark:text-slate-500 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={taskModal.description}
                  onChange={(e) => setTaskModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Chapter 1 to 5 practice questions"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-855 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-455 dark:text-slate-500 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskModal.dueDate}
                    onChange={(e) => setTaskModal(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-855 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-455 dark:text-slate-500 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskModal.priority}
                    onChange={(e) => setTaskModal(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-855 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setTaskModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-650 hover:bg-blue-700 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
