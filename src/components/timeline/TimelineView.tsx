'use client'

import { useState } from 'react'
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
  List
} from 'lucide-react'
import { deleteLifeEvent } from '@/app/actions/life-events'

interface LifeEvent {
  id: string
  title: string
  type: string
  event_date: string
  importance?: number
}

interface TimelineViewProps {
  initialEvents: LifeEvent[]
}

const typeStyles: Record<string, { icon: any, color: string, bg: string, dot: string }> = {
  EXAM: { icon: CalendarIcon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20', dot: 'bg-red-500' },
  CERT_EXAM: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  PROJECT_MILESTONE: { icon: Flag, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20', dot: 'bg-indigo-500' },
  ASSIGNMENT: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20', dot: 'bg-orange-500' },
  COMPETITION: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', dot: 'bg-amber-500' },
  INTERNSHIP_DEADLINE: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', dot: 'bg-blue-500' },
}

export function TimelineView({ initialEvents }: TimelineViewProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

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

  // Categorize events for LIST view
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

  // Get events on selected date (for calendar sidebar/details panel)
  const eventsOnSelectedDate = selectedDate
    ? initialEvents.filter(e => {
        const d = new Date(e.event_date)
        return d.toDateString() === selectedDate.toDateString()
      })
    : []

  const renderEventRow = (event: LifeEvent, isPast = false) => {
    const style = typeStyles[event.type] || { icon: CalendarDays, color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-500' }
    const Icon = style.icon
    const eventDate = new Date(event.event_date)

    return (
      <div
        key={event.id}
        className={`flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 ${
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

  return (
    <div className="space-y-6">
      {/* TOGGLE & CONTROLS */}
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

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-8 animate-in fade-in duration-300">
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Later This Month</h3>
              <div className="space-y-3">
                {categorizedEvents.thisMonth.map(e => renderEventRow(e))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {categorizedEvents.upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Future Events</h3>
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
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* CALENDAR GRID */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs">
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
                
                // Get events on this specific calendar day
                const dayEvents = initialEvents.filter(e => {
                  const d = new Date(e.event_date)
                  return d.toDateString() === day.toDateString()
                })

                return (
                  <button
                    key={`day-${idx}`}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square relative rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-sans text-xs font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                        : isToday
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    
                    {/* Events indicators dot */}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1.5 flex gap-1 justify-center max-w-full px-1">
                        {dayEvents.slice(0, 3).map((e, eIdx) => {
                          const style = typeStyles[e.type] || { dot: 'bg-slate-400' }
                          return (
                            <span
                              key={eIdx}
                              className={`h-1 w-1 rounded-full ${style.dot}`}
                            />
                          )
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* DATE DETAILS */}
          <div className="lg:col-span-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs max-h-[500px]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
                : 'Select a Date'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {eventsOnSelectedDate.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 text-center font-medium">
                  <CalendarIcon className="h-8 w-8 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs">No deadlines or events on this day.</p>
                </div>
              ) : (
                eventsOnSelectedDate.map(e => {
                  const style = typeStyles[e.type] || { icon: CalendarDays, color: 'text-slate-500', bg: 'bg-slate-100' }
                  const Icon = style.icon
                  return (
                    <div
                      key={e.id}
                      className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3"
                    >
                      <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${style.bg}`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 line-clamp-2">
                          {e.title}
                        </h4>
                        <span className="inline-block text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
                          {e.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
