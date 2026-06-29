import { Calendar as CalendarIcon, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { getWeeklyTimetable } from '@/app/actions/academic'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default async function TimetablePage() {
  const timetable = await getWeeklyTimetable()

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link 
          href="/academic"
          className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Weekly Timetable
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your recurring university class schedule.
          </p>
        </div>
      </div>

      {/* TIMETABLE LAYOUT - Overflow scroll wrapper for mobile responsiveness (P3/P5) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-x-auto">
        <div className="grid grid-cols-5 gap-6 min-w-[900px]">
          {DAYS.map((day) => {
            // Filter and sort sessions for this day
            const daySessions = timetable
              .filter((s) => s.day === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))

            return (
              <div key={day} className="space-y-4">
                <h3 className="text-center text-xs font-black text-slate-900 dark:text-white pb-2 border-b dark:border-gray-800 uppercase tracking-wider">
                  {day}
                </h3>
                
                <div className="space-y-3">
                  {daySessions.length === 0 ? (
                    <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-600 italic py-4">
                      No classes
                    </p>
                  ) : (
                    daySessions.map((session) => (
                      <div 
                        key={session.id} 
                        className="rounded-xl bg-indigo-50/50 border border-indigo-100/50 p-3.5 dark:bg-indigo-950/20 dark:border-indigo-900/30 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-700 dark:text-indigo-400">
                          <Clock className="h-3 w-3" />
                          <span>{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                          {session.module?.name}
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
                          <span>{session.session_type}</span>
                          <span>{session.location}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
