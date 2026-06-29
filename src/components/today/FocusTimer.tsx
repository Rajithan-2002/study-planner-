'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Flame } from 'lucide-react'
import { saveStudySession } from '@/app/actions/today'
import { useRouter } from 'next/navigation'

export function FocusTimer({ 
  moduleId, 
  moduleName, 
  defaultMinutes = 25, 
  initialSessionsCount = 0 
}: { 
  moduleId?: string
  moduleName?: string
  defaultMinutes?: number
  initialSessionsCount?: number 
}) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessionCount, setSessionCount] = useState(initialSessionsCount)

  // Sync initial count if it changes on render
  useEffect(() => {
    setSessionCount(initialSessionsCount)
  }, [initialSessionsCount])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      setIsActive(false)
      
      // Save session in Supabase Database (Persistently)
      saveStudySession(moduleId || null, defaultMinutes).then(res => {
        if (res.success) {
          setSessionCount(c => c + 1)
          router.refresh() // Updates layout/statistics reactively
        } else {
          console.error('Failed to log Pomodoro session:', res.error)
          // Fallback to local increment anyway for visual assurance
          setSessionCount(c => c + 1)
        }
      })
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, moduleId, defaultMinutes, router])

  const toggleTimer = () => setIsActive(!isActive)
  
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(defaultMinutes * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <Flame className="h-5 w-5 fill-primary/10" />
        <span className="text-xs font-black uppercase tracking-wider">{moduleName ? `Focus: ${moduleName}` : 'Pomodoro Session'}</span>
      </div>

      <div className="text-6xl font-black text-foreground tracking-tighter mb-8 font-mono">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4 z-10">
        <button 
          onClick={toggleTimer}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-xs transition-transform hover:scale-102 active:scale-98 cursor-pointer ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/95'}`}
        >
          {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isActive ? 'Pause' : 'Start Focus'}
        </button>
        
        <button 
          onClick={resetTimer}
          className="p-3 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/85 transition-colors cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
        Sessions Completed Today: {sessionCount}
      </div>
    </div>
  )
}
