'use client'

import { useState } from 'react'
import { 
  FileText, 
  Sparkles, 
  Calendar, 
  Clock, 
  Edit3, 
  RefreshCw, 
  Flame, 
  ShieldCheck, 
  BookOpen, 
  Code2, 
  Cloud, 
  Terminal, 
  Award, 
  Check, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { saveUserInstructions, syncInstructionsToTasks, ParsedInstructions } from '@/app/actions/instructions'

interface Props {
  initialInstructions: ParsedInstructions
}

export function UserInstructionsWidget({ initialInstructions }: Props) {
  const [instructions, setInstructions] = useState<ParsedInstructions>(initialInstructions)
  const [isEditing, setIsEditing] = useState(false)
  const [rawText, setRawText] = useState(initialInstructions.rawContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [showPostLeave, setShowPostLeave] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const res = await saveUserInstructions(rawText)
    setIsSaving(false)
    if (res.success) {
      setIsEditing(false)
      // refresh component state with updated content
      const updated = await import('@/app/actions/instructions').then(m => m.parseInstructions(rawText))
      setInstructions(updated)
      setSyncMessage('Instructions & sprint schedule updated successfully!')
      setTimeout(() => setSyncMessage(null), 4000)
    } else {
      alert(res.error || 'Failed to save instructions')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    const res = await syncInstructionsToTasks(rawText)
    setIsSyncing(false)
    if (res.success) {
      setSyncMessage('Synced 7-Day Leave Sprint items to your Active Workload!')
      setTimeout(() => setSyncMessage(null), 4000)
    } else {
      alert(res.error || 'Failed to sync sprint tasks')
    }
  }

  const getSubjectIcon = (name: string) => {
    if (name.includes('SC-500')) return <ShieldCheck className="h-4 w-4 text-amber-500" />
    if (name.includes('Java')) return <Code2 className="h-4 w-4 text-blue-500" />
    if (name.includes('AWS')) return <Cloud className="h-4 w-4 text-orange-500" />
    if (name.includes('TryHackMe')) return <Terminal className="h-4 w-4 text-emerald-500" />
    if (name.includes('CRTA')) return <Award className="h-4 w-4 text-purple-500" />
    return <BookOpen className="h-4 w-4 text-primary" />
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-6 shadow-sm relative overflow-hidden transition-all hover:border-primary/40">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground font-sans">
                Active 7-Day Leave Sprint
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Max Productivity Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{instructions.sprintDates}</span>
              <span className="text-border">•</span>
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>~{instructions.totalDailyHours} hrs / day target</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
            title="Sync items into Active Tasks"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Tasks'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Instructions File</span>
          </button>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            {syncMessage}
          </span>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-500 hover:text-emerald-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* EDIT MODAL / INLINE EDITOR */}
      {isEditing ? (
        <div className="mt-4 space-y-4 relative z-10 border border-border bg-background p-4 rounded-xl">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Editing <code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded text-primary">user_instructions.md</code>
            </h4>
            <span className="text-[10px] text-muted-foreground font-semibold">Changes will update both file & app dashboard</span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-80 font-mono text-xs p-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            placeholder="Type your study instructions..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Save & Update Dashboard
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* SPRINT TARGETS GRID */
        <div className="mt-5 space-y-5 relative z-10">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Daily Focus Allocations (7-Day Leave)
              </h4>
              <span className="text-xs font-bold text-foreground bg-primary/10 px-2.5 py-0.5 rounded-full text-primary border border-primary/20">
                {instructions.dailyBreakdown.length} Active Modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {instructions.dailyBreakdown.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-background border border-border hover:border-primary/30 p-3.5 rounded-lg flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-md bg-secondary text-foreground group-hover:bg-primary/10 transition-colors">
                        {getSubjectIcon(item.name)}
                      </div>
                      <span className="text-xs font-bold text-foreground truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                      {item.hours >= 1 ? `${item.hours}h` : `${item.hours * 60}m`}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-[11px] text-muted-foreground font-medium line-clamp-2 mt-1">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* POST-LEAVE ROUTINE TOGGLE */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowPostLeave(!showPostLeave)}
              className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Post-Leave Schedule Rules (Starting July 27)
              </span>
              {showPostLeave ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showPostLeave && (
              <div className="mt-3 p-4 rounded-lg bg-background border border-border space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded border border-border bg-card">
                    <span className="font-extrabold text-primary block mb-1">SC-500 Priority</span>
                    <p className="text-muted-foreground">{instructions.postLeaveRules.sc500Priority}</p>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-card">
                    <span className="font-extrabold text-primary block mb-1">AWS & CLLMSP Daily</span>
                    <p className="text-muted-foreground">AWS (30m/day) + CLLMSP (30m/day)</p>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-card">
                    <span className="font-extrabold text-primary block mb-1">Alternating Cyber Track</span>
                    <p className="text-muted-foreground">{instructions.postLeaveRules.alternatingTracks}</p>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-card">
                    <span className="font-extrabold text-primary block mb-1">Weekend Schedule</span>
                    <p className="text-muted-foreground">{instructions.postLeaveRules.weekendSchedule}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
