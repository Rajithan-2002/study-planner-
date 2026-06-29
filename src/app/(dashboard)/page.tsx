import { Target, Calendar, AlertCircle, Clock, GraduationCap, Award, Briefcase, Sparkles, ChevronRight } from 'lucide-react'
import { getDashboardData } from '@/app/actions/dashboard'
import Link from 'next/link'
import { QuickCapture } from '@/components/dashboard/QuickCapture'

export default async function DashboardPage() {
  const data = await getDashboardData()

  const { academicStats, projectStats, certStats, todaysClasses, focusItems, timelineEvents } = data

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER & QUICK CAPTURE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Mission Control
          </h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            What deserves your attention right now?
          </p>
        </div>
        
        {/* Always-Visible Quick Capture */}
        <div className="w-full sm:w-auto shrink-0">
          <QuickCapture />
        </div>
      </div>
      
      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: 70% */}
        <div className="w-full lg:w-[70%] space-y-8">
          
          {/* HERO: TODAY'S FOCUS */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Today's Focus</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Classes */}
                <div className="space-y-4 bg-background p-5 rounded-lg border border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Today's Schedule
                  </h4>
                  {todaysClasses.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-medium py-2">No classes scheduled today.</p>
                  ) : (
                    <div className="space-y-2">
                      {todaysClasses.map(cls => (
                        <div key={cls.id} className="flex justify-between items-center bg-card p-3 rounded-md border border-border">
                          <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{cls.module?.name}</span>
                          <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">{cls.start_time.substring(0, 5)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Priorities */}
                <div className="space-y-4 bg-background p-5 rounded-lg border border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" /> Urgent Tasks
                  </h4>
                  {focusItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-medium py-2">No high-priority tasks pending.</p>
                  ) : (
                    <div className="space-y-2">
                      {focusItems.slice(0, 2).map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-3 rounded-md border ${item.isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'}`}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate max-w-[160px]">{item.title}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${item.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>{item.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* METRICS ROW (Academic, Projects, Certs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Academic Status */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Academic Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-bold">GPA</span>
                  <div className="text-right leading-none">
                    <span className="text-2xl font-black tracking-tight text-foreground">{academicStats.currentGpa.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground font-bold ml-1">/ {academicStats.targetGpa.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Credits Complete</span>
                    <span className="text-foreground">{academicStats.creditsCompleted} / {academicStats.creditsTotal}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (academicStats.creditsCompleted / academicStats.creditsTotal) * 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground font-bold">Highest Risk Module</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${academicStats.highestRiskModule !== 'None' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-secondary'}`}>
                    {academicStats.highestRiskModule}
                  </span>
                </div>
              </div>
            </div>

            {/* Projects Status */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Projects</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-bold">Active Projects</span>
                  <span className="text-2xl font-black tracking-tight text-foreground">{projectStats.activeCount}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Project Health</span>
                    <span className="text-foreground">{projectStats.healthScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${projectStats.healthScore}%` }} 
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground font-bold">Overdue Projects</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${projectStats.overdueCount > 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-secondary'}`}>
                    {projectStats.overdueCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Certifications Status */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Certifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-bold">Active Journeys</span>
                  <span className="text-2xl font-black tracking-tight text-foreground">{certStats.activeCount}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Readiness Index</span>
                    <span className="text-foreground">{certStats.readinessScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${certStats.readinessScore}%` }} 
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground font-bold">Next Exam</span>
                  <span className="font-bold text-foreground text-[10px]">
                    {certStats.daysRemaining !== null ? `in ${certStats.daysRemaining} days` : 'None Scheduled'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: 30% */}
        <div className="w-full lg:w-[30%] space-y-8">
          
          {/* AI Insights */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">AI Intelligence</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              {focusItems.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium italic">No immediate risks detected in your curriculum.</p>
              ) : (
                focusItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs font-semibold text-muted-foreground">
                    <span className="text-primary shrink-0">•</span>
                    <span>{item.title} {item.isOverdue ? 'is OVERDUE.' : `is approaching (${item.subtitle}).`}</span>
                  </div>
                ))
              )}
            </div>

            <Link 
              href="/assistant" 
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors"
            >
              Ask Assistant <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Timeline Widget (Next 7 days) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">Timeline</h3>
              </div>
              <Link href="/timeline" className="text-xs font-bold text-primary hover:underline">View Calendar</Link>
            </div>

            <div className="space-y-4">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium py-2">No deadlines in the next 7 days.</p>
              ) : (
                timelineEvents.slice(0, 4).map((event, idx) => (
                  <div key={event.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-primary">
                    {idx !== Math.min(timelineEvents.length, 4) - 1 && (
                      <div className="absolute left-[3px] top-4 w-px h-[120%] bg-border" />
                    )}
                    <p className="text-xs font-bold text-foreground leading-snug">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{event.type}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
