import { GraduationCap, Clock } from 'lucide-react'
import Link from 'next/link'
import { getAcademicProfile, getWeeklyTimetable } from '@/app/actions/academic'
import { SemesterList } from '@/components/academic/SemesterList'

export default async function AcademicHubPage() {
  const { user, currentSemester, allModules, semesters } = await getAcademicProfile()
  const timetable = await getWeeklyTimetable()

  // Calculate some basic stats
  const completedModules = allModules.filter(m => m.status === 'COMPLETED')
  const creditsCompleted = completedModules.reduce((acc, m) => acc + (m.credits || 0), 0)

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaysClasses = timetable.filter(t => t.day === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time))

  // Build the mapped semesters array for the tap-to-expand list
  const mappedSemesters = (semesters || []).map(sem => {
    return {
      id: sem.id,
      year: sem.year,
      semester: sem.semester,
      modules: allModules.filter(m => m.semester_id === sem.id)
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Academic Hub
          </h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Track your degree progress, modules, and results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/academic/roadmap" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-xs transition-colors text-sm"
          >
            <GraduationCap className="h-4.5 w-4.5" />
            Curriculum Roadmap
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Profile & Timetable */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          
          {/* Profile Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">Academic Profile</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-0.5 truncate">{user?.degree_name || 'Degree Not Set'}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm font-semibold">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs text-muted-foreground">University</span>
                <span className="text-foreground">{user?.university || 'Not Set'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs text-muted-foreground">Current Standing</span>
                <span className="text-foreground">
                  {currentSemester ? `Year ${currentSemester.year} Sem ${currentSemester.semester}` : 'Not Set'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs text-muted-foreground">Credits Complete</span>
                <span className="text-foreground">{creditsCompleted}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs text-muted-foreground">Current GPA</span>
                <span className="text-xl font-black text-primary">{user?.current_gpa || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Target GPA</span>
                <span className="text-muted-foreground">{user?.target_gpa || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Today's Classes</h3>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{todayStr}</p>
              </div>
            </div>

            <div className="space-y-3">
              {todaysClasses.length === 0 ? (
                <p className="text-xs font-semibold text-muted-foreground text-center py-4">No classes today.</p>
              ) : (
                todaysClasses.map(session => (
                  <div key={session.id} className="rounded-lg border border-border bg-background p-4 hover:border-primary transition-colors cursor-pointer">
                    <h4 className="text-xs font-bold text-foreground leading-tight">{session.module?.name}</h4>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{session.session_type} • {session.location}</span>
                      <span className="text-[9px] font-black tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {session.start_time.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Semester Tap-to-Expand Cards */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-foreground">Degree Curriculum</h3>
          </div>
          
          {mappedSemesters.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border">
              <p className="text-sm font-bold text-muted-foreground">No semesters found. Please set up your academic roadmap.</p>
            </div>
          ) : (
            <SemesterList semesters={mappedSemesters} />
          )}

        </div>

      </div>
    </div>
  )
}
