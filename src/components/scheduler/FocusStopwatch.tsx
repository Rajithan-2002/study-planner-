'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, CheckCircle, RefreshCw, Loader2, Clock } from 'lucide-react'
import { logWorkSessionAction } from '@/app/actions/work-sessions'
import { useRouter } from 'next/navigation'

interface FocusStopwatchProps {
  projects: { id: string; name: string }[]
  certifications: { id: string; name: string }[]
}

export function FocusStopwatch({ projects, certifications }: FocusStopwatchProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<'PROJECT' | 'CERTIFICATION'>('PROJECT')
  const [selectedId, setSelectedId] = useState<string>('')
  
  // Duration configurations
  const [presetMinutes, setPresetMinutes] = useState<number>(30)
  const [customMinutes, setCustomMinutes] = useState<string>('')
  
  // Timer State
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  
  const [isLogging, setIsLogging] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize targets
  useEffect(() => {
    if (selectedType === 'PROJECT' && projects.length > 0) {
      setSelectedId(projects[0].id)
    } else if (selectedType === 'CERTIFICATION' && certifications.length > 0) {
      setSelectedId(certifications[0].id)
    } else {
      setSelectedId('')
    }
  }, [selectedType, projects, certifications])

  // Timer Tick logic
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, isPaused])

  const getTargetMinutes = () => {
    if (presetMinutes === -1) {
      const parsed = parseInt(customMinutes, 10)
      return isNaN(parsed) || parsed <= 0 ? 30 : parsed
    }
    return presetMinutes
  }

  const handleStart = () => {
    if (!selectedId) {
      setMessage({ type: 'error', text: 'Please select a project or certification target.' })
      return
    }
    const mins = getTargetMinutes()
    setSecondsRemaining(mins * 60)
    setElapsedSeconds(0)
    setIsActive(true)
    setIsPaused(false)
    setMessage(null)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsActive(false)
    setIsPaused(false)
    setSecondsRemaining(0)
    setElapsedSeconds(0)
  }

  const handleTimerComplete = () => {
    handleStop()
    // Auto-save session
    submitWorkSession(getTargetMinutes())
  }

  const handleForceComplete = () => {
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60))
    handleStop()
    submitWorkSession(elapsedMins)
  }

  const submitWorkSession = async (mins: number) => {
    setIsLogging(true)
    setMessage(null)
    try {
      const res = await logWorkSessionAction({
        entity_type: selectedType,
        entity_id: selectedId,
        duration_minutes: mins,
        notes: notes || `Focus session completed: ${mins}m`,
        status: 'COMPLETED'
      })

      if (res.success) {
        setMessage({ type: 'success', text: `Successfully logged ${mins}m work session.` })
        setNotes('')
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to log focus session.' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Server error occurred.' })
    } finally {
      setIsLogging(false)
    }
  }

  // Formatting remaining time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const targets = selectedType === 'PROJECT' ? projects : certifications

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" /> Focus Session Runtime
        </h3>
        {isActive && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {!isActive ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Session Type</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white cursor-pointer"
              >
                <option value="PROJECT">Project Work</option>
                <option value="CERTIFICATION">Cert Preparation</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Entity</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white cursor-pointer"
              >
                <option value="" disabled>Select target...</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preset Duration</label>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPresetMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    presetMinutes === mins
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {mins}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPresetMinutes(-1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  presetMinutes === -1
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {presetMinutes === -1 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Custom Minutes</label>
              <input
                type="number"
                min="1"
                placeholder="E.g., 120"
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="What are you working on?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow hover:scale-[1.01] transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" /> Start Focus Session
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 space-y-5">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              Focusing on: {targets.find(t => t.id === selectedId)?.name || 'Target'}
            </p>
            <div className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight animate-pulse">
              {formatTime(secondsRemaining)}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full max-w-xs justify-center">
            {isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5 fill-current" /> Pause
              </button>
            )}

            <button
              type="button"
              onClick={handleForceComplete}
              disabled={isLogging}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {isLogging ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Log Early
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="flex items-center justify-center p-2.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer"
              title="Cancel Timer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
