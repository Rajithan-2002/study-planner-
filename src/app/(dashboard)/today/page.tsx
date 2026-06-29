import { Clock, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getTodayCommandCenterData } from '@/app/actions/today'
import { FocusTimer } from '@/components/today/FocusTimer'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'

export default async function TodayPage() {
  const data = await getTodayCommandCenterData()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
          Command Center
        </h2>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          What exactly should I do in the next 12 hours?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Morning & Immediate Deadlines */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          
          {/* Morning / Today's Classes */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Morning Schedule</h3>
            </div>
            
            <div className="space-y-4">
              {data.todaysClasses.length === 0 ? (
                <p className="text-xs font-semibold text-muted-foreground py-4 text-center">No classes scheduled.</p>
              ) : (
                data.todaysClasses.map((cls, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-foreground">{cls.module?.name}</span>
                    </div>
                    <div className="text-[10px] font-black tracking-wide text-primary">
                      {cls.start_time.substring(0, 5)} - {cls.end_time.substring(0, 5)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Immediate Deadlines (48h) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Within 48 Hours</h3>
            </div>
            
            <div className="space-y-3">
              {data.immediateDeadlines.length === 0 ? (
                <p className="text-xs font-semibold text-muted-foreground text-center py-4">No immediate deadlines.</p>
              ) : (
                data.immediateDeadlines.map((deadline, idx) => {
                  const now = new Date()
                  const target = new Date(deadline.date)
                  const diffTime = target.getTime() - now.getTime()
                  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
                  
                  return (
                    <div key={idx} className="flex justify-between items-center p-3.5 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{deadline.title}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mt-1">{deadline.type}</span>
                      </div>
                      <span className="text-[10px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded shrink-0 ml-2">
                        {diffHours <= 0 ? 'OVERDUE' : `in ${diffHours}h`}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: Tasks (Grouped) */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Task Queue</h3>
            </div>

            <div className="space-y-6">
              
              {/* Critical */}
              <div>
                <h4 className="text-[10px] font-black text-destructive uppercase tracking-wider mb-3">Critical (Do Now)</h4>
                <div className="space-y-2">
                  {data.tasks.critical.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground italic py-1">No critical tasks.</p>
                  ) : (
                    data.tasks.critical.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-lg border border-border bg-background hover:bg-secondary/40 transition-colors">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                        <p className="text-[9px] font-black uppercase tracking-wider mt-1 text-destructive ml-8">{t.due_date ? 'OVERDUE / TODAY' : 'CRITICAL PRIORITY'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Important */}
              <div>
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-3">Important (Next)</h4>
                <div className="space-y-2">
                  {data.tasks.important.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground italic py-1">No important tasks.</p>
                  ) : (
                    data.tasks.important.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-lg border border-border bg-background hover:bg-secondary/40 transition-colors">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                        <p className="text-[9px] font-black uppercase tracking-wider mt-1 text-muted-foreground ml-8">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'HIGH PRIORITY'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Optional */}
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">Optional (Later)</h4>
                <div className="space-y-2">
                  {data.tasks.optional.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground italic py-1">No optional tasks.</p>
                  ) : (
                    data.tasks.optional.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-lg border border-border bg-background hover:bg-secondary/40 transition-colors">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Study Blocks & Focus Timer */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          
          <FocusTimer 
            moduleId={data.studyBlocks[0]?.moduleId} 
            moduleName={data.studyBlocks[0]?.moduleName} 
            defaultMinutes={25}
            initialSessionsCount={data.todaySessionsCount} 
          />

          {/* Planned Study Blocks */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Study Blocks</h3>
            </div>
            
            <div className="space-y-4">
              {data.studyBlocks.length === 0 ? (
                <p className="text-xs font-semibold text-muted-foreground text-center py-4">No specific study sessions mapped.</p>
              ) : (
                data.studyBlocks.map((block, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-background p-4">
                    <p className="text-[9px] font-black text-primary uppercase tracking-wider mb-1">{block.moduleCode}</p>
                    <p className="text-sm font-bold text-foreground mb-3">{block.examName} Prep</p>
                    
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold">
                      <span className="text-muted-foreground">Target Time</span>
                      <span className="text-foreground">{block.hours} Hours</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-muted-foreground">Prep Status</span>
                      <span className="text-primary">{block.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${block.progress}%` }} />
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
