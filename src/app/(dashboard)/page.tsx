import { Target, Calendar, AlertCircle, Clock, GraduationCap, Award, Briefcase, Sparkles, ChevronRight, Activity } from 'lucide-react'
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
          
          {/* HERO: TODAY'S FOCUS & INTELLIGENT PLAN */}
          {(() => {
            const planning = data.planningStats || {
              totalRemainingHours: 0,
              totalEstimatedHours: 0,
              todayRecommendedHours: '0h 0m',
              weeklyCapacityHours: 32,
              planningHealth: 100,
              averageCompletionProbability: 100,
              dailyPlanAllocations: []
            }
            return (
              <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] pointer-events-none rounded-full" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Intelligent Planning</h3>
                        <p className="text-xs text-muted-foreground font-semibold">Dynamic allocations calculated from workload remaining & capacity.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-muted-foreground">Planning Health:</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${planning.planningHealth >= 80 ? 'bg-emerald-500/10 text-emerald-500' : planning.planningHealth >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {planning.planningHealth}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Today's Recommended Plan */}
                    <div className="lg:col-span-7 space-y-4 bg-background p-5 rounded-lg border border-border">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Today's Flexible Workload</span>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{planning.todayRecommendedHours} Recommended</span>
                      </h4>
                      
                      {planning.dailyPlanAllocations.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-semibold py-4 text-center">No active workload allocations scheduled for today. You are fully caught up!</p>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                          {planning.dailyPlanAllocations.map((alloc: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-card p-3 rounded-md border border-border hover:border-muted-foreground/20 transition-colors">
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-xs font-extrabold text-foreground truncate">{alloc.name}</span>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[8px] font-black uppercase text-primary tracking-wider">{alloc.type}</span>
                                  <span className="truncate max-w-[150px]">• {alloc.reason}</span>
                                </span>
                              </div>
                              <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                                {alloc.allocated_minutes >= 60 ? `${(alloc.allocated_minutes / 60).toFixed(1)}h` : `${alloc.allocated_minutes}m`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Planning & Capacity Stats */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                      <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining Hours</span>
                        <div className="mt-2">
                          <span className="text-2xl font-black text-foreground">{planning.totalRemainingHours}h</span>
                          <span className="text-[9px] font-semibold text-muted-foreground block mt-1">out of {planning.totalEstimatedHours}h estimated</span>
                        </div>
                      </div>

                      <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Forecast Probability</span>
                        <div className="mt-2">
                          <span className={`text-2xl font-black ${planning.averageCompletionProbability >= 80 ? 'text-emerald-500' : planning.averageCompletionProbability >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                            {planning.averageCompletionProbability}%
                          </span>
                          <span className="text-[9px] font-semibold text-muted-foreground block mt-1">Likelihood of meeting deadlines</span>
                        </div>
                      </div>

                      <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between col-span-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weekly Capacity Load</span>
                          <span className="text-xs font-extrabold text-foreground">{planning.weeklyCapacityHours}h / week</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (planning.totalRemainingHours / Math.max(1, planning.weeklyCapacityHours)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* METRICS ROW (Academic, Projects, Certs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Academic Status */}
            <Link href="/academic" className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35 block cursor-pointer">
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
            </Link>

            {/* Projects Status */}
            <Link href="/projects" className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35 block cursor-pointer">
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
            </Link>

            {/* Certifications Status */}
            <Link href="/certifications" className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-muted-foreground/35 block cursor-pointer">
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
            </Link>

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

          {/* AI Automation Widget */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">AI Automation</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-border">
                <span className="text-muted-foreground">Pending Proposals</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${data.automationStats.pendingCount > 0 ? 'text-amber-500 bg-amber-500/10 font-extrabold animate-pulse' : 'text-muted-foreground bg-secondary font-semibold'}`}>
                  {data.automationStats.pendingCount}
                </span>
              </div>
              
              <div className="space-y-2">
                {data.automationStats.recentLogs.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground font-semibold italic">No recent execution logs.</p>
                ) : (
                  data.automationStats.recentLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                      <span className="truncate max-w-[150px]">• {log.step_name}</span>
                      <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}>{log.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link 
              href="/automation" 
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors"
            >
              Open Action Center <ChevronRight className="h-4 w-4" />
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
