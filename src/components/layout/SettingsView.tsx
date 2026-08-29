'use client'

import { useState, useTransition, useEffect } from 'react'
import { User, Settings, Clock, Brain, Settings2, Loader2, Sparkles, AlertTriangle, ShieldCheck, Moon, Sun, Database, LogOut } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/profile'
import { signOut } from '@/app/auth/actions'
import { saveSchedulerPreferences } from '@/app/actions/scheduler'
import { updateUserPreferencesAction } from '@/app/actions/memory'
import { seedMasterCurriculum } from '@/app/actions/academic'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface SettingsViewProps {
  initialProfile: any
  initialSchedulerPrefs: any
  initialPersonalizationPrefs: any
}

export function SettingsView({
  initialProfile,
  initialSchedulerPrefs,
  initialPersonalizationPrefs
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'scheduler' | 'ai' | 'system'>('profile')
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  // Seeding confirmation modal
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (root.classList.contains('dark')) {
      setTheme('dark')
    }
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    full_name: initialProfile?.full_name || '',
    university: initialProfile?.university || '',
    degree_name: initialProfile?.degree_name || '',
    graduation_year: initialProfile?.graduation_year?.toString() || '',
    career_goal: initialProfile?.career_goal || '',
    current_gpa: initialProfile?.current_gpa?.toString() || '0.0',
    target_gpa: initialProfile?.target_gpa?.toString() || '4.0',
    current_year: initialProfile?.current_year?.toString() || '1',
    current_semester: initialProfile?.current_semester?.toString() || '1'
  })

  // Scheduler preferences state
  const [schedulerForm, setSchedulerForm] = useState({
    preferred_focus_time: initialSchedulerPrefs?.preferred_focus_time || 'MORNING',
    max_daily_study_hours: initialSchedulerPrefs?.max_daily_study_hours?.toString() || '4.0',
    max_daily_project_hours: initialSchedulerPrefs?.max_daily_project_hours?.toString() || '3.0',
    buffer_minutes: initialSchedulerPrefs?.buffer_minutes?.toString() || '10',
    sleep_start_time: initialSchedulerPrefs?.sleep_start_time || '23:00',
    sleep_end_time: initialSchedulerPrefs?.sleep_end_time || '07:00',
    work_start_time: initialSchedulerPrefs?.work_start_time || '08:00',
    work_end_time: initialSchedulerPrefs?.work_end_time || '18:00'
  })

  // Personalization AI state
  const [personalizationForm, setPersonalizationForm] = useState({
    preferredStudyHours: initialPersonalizationPrefs?.preferredStudyHours || 4.0,
    preferredAiStyle: initialPersonalizationPrefs?.preferredAiStyle || 'BALANCED',
    preferredLearningStyle: initialPersonalizationPrefs?.preferredLearningStyle || 'VISUAL',
    focusDuration: initialPersonalizationPrefs?.focusDuration || 45
  })

  const clearAlerts = () => {
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearAlerts()
    
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateUserProfile(formData)
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to update profile.')
      } else {
        setSuccessMsg('Profile updated successfully!')
        window.dispatchEvent(new Event('profile-updated'))
      }
    })
  }

  const handleSchedulerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearAlerts()

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveSchedulerPreferences(formData)
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to update scheduler preferences.')
      } else {
        setSuccessMsg('Scheduler preferences saved!')
      }
    })
  }

  const handlePersonalizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()

    startTransition(async () => {
      const res = await updateUserPreferencesAction({
        preferredStudyHours: Number(personalizationForm.preferredStudyHours),
        preferredAiStyle: personalizationForm.preferredAiStyle as any,
        preferredLearningStyle: personalizationForm.preferredLearningStyle as any,
        focusDuration: Number(personalizationForm.focusDuration)
      })
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save AI/Memory preferences.')
      } else {
        setSuccessMsg('AI & Cognitive Memory settings saved!')
      }
    })
  }

  const handleRunSeed = async () => {
    setIsSeeding(true)
    setSeedError(null)
    try {
      const res = await seedMasterCurriculum()
      if (res && !res.success) {
        setSeedError(res.error || 'Failed to run database curriculum seeding.')
      } else {
        setIsSeedModalOpen(false)
        setSuccessMsg('Database Master Curriculum seeded successfully!')
      }
    } catch (err: any) {
      setSeedError(err.message || 'Seeding failed.')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Navigation tabs */}
      <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-4 lg:pb-0 lg:pr-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => { setActiveTab('profile'); clearAlerts(); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="h-4.5 w-4.5" />
          User Profile
        </button>

        <button
          onClick={() => { setActiveTab('scheduler'); clearAlerts(); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'scheduler'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="h-4.5 w-4.5" />
          Scheduler Preferences
        </button>

        <button
          onClick={() => { setActiveTab('ai'); clearAlerts(); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="h-4.5 w-4.5" />
          AI & Memory settings
        </button>

        <button
          onClick={() => { setActiveTab('system'); clearAlerts(); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings2 className="h-4.5 w-4.5" />
          Appearance & System
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs relative">
        {/* Status Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Profile form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Academic User Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">University</label>
                <input
                  type="text"
                  name="university"
                  value={profileForm.university}
                  onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Degree Program</label>
                <input
                  type="text"
                  name="degree_name"
                  value={profileForm.degree_name}
                  onChange={(e) => setProfileForm({ ...profileForm, degree_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current GPA</label>
                <input
                  type="number"
                  name="current_gpa"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  value={profileForm.current_gpa}
                  onChange={(e) => setProfileForm({ ...profileForm, current_gpa: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target GPA</label>
                <input
                  type="number"
                  name="target_gpa"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  value={profileForm.target_gpa}
                  onChange={(e) => setProfileForm({ ...profileForm, target_gpa: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Career Goal</label>
                <textarea
                  name="career_goal"
                  rows={3}
                  value={profileForm.career_goal}
                  onChange={(e) => setProfileForm({ ...profileForm, career_goal: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Profile Settings
            </Button>
          </form>
        )}

        {/* 2. Scheduler form */}
        {activeTab === 'scheduler' && (
          <form onSubmit={handleSchedulerSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Scheduler Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Focus Time</label>
                <select
                  name="preferred_focus_time"
                  value={schedulerForm.preferred_focus_time}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, preferred_focus_time: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="MORNING">Morning (08:00 - 12:00)</option>
                  <option value="AFTERNOON">Afternoon (12:00 - 17:00)</option>
                  <option value="EVENING">Evening (17:00 - 21:00)</option>
                  <option value="NIGHT">Night (21:00 - 01:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buffer Time (Minutes)</label>
                <input
                  type="number"
                  name="buffer_minutes"
                  value={schedulerForm.buffer_minutes}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, buffer_minutes: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Daily Study Hours</label>
                <input
                  type="number"
                  name="max_daily_study_hours"
                  step="0.5"
                  value={schedulerForm.max_daily_study_hours}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, max_daily_study_hours: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Daily Project Hours</label>
                <input
                  type="number"
                  name="max_daily_project_hours"
                  step="0.5"
                  value={schedulerForm.max_daily_project_hours}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, max_daily_project_hours: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workday Start Time</label>
                <input
                  type="time"
                  name="work_start_time"
                  value={schedulerForm.work_start_time}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, work_start_time: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workday End Time</label>
                <input
                  type="time"
                  name="work_end_time"
                  value={schedulerForm.work_end_time}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, work_end_time: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Scheduler Preferences
            </Button>
          </form>
        )}

        {/* 3. AI form */}
        {activeTab === 'ai' && (
          <form onSubmit={handlePersonalizationSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              AI Cognitive & Memory Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Assistant Style</label>
                <select
                  value={personalizationForm.preferredAiStyle}
                  onChange={(e) => setPersonalizationForm({ ...personalizationForm, preferredAiStyle: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="BALANCED">Balanced Orchestrator</option>
                  <option value="DIRECTIVE">Strict Executive</option>
                  <option value="SUPPORTIVE">Empathetic Coach</option>
                  <option value="ANALYTICAL">Precision Analyst</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Learning Style Profile</label>
                <select
                  value={personalizationForm.preferredLearningStyle}
                  onChange={(e) => setPersonalizationForm({ ...personalizationForm, preferredLearningStyle: e.target.value })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="VISUAL">Visual (Charts, Mind Maps)</option>
                  <option value="AUDITORY">Auditory (Lectures, Recitations)</option>
                  <option value="KINAESTHETIC">Kinaesthetic (Practical Labs)</option>
                  <option value="READ_WRITE">Textual (Obsidian Notes, Draft Notebooks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Study Target (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={personalizationForm.preferredStudyHours}
                  onChange={(e) => setPersonalizationForm({ ...personalizationForm, preferredStudyHours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ideal Focus Block (Minutes)</label>
                <input
                  type="number"
                  value={personalizationForm.focusDuration}
                  onChange={(e) => setPersonalizationForm({ ...personalizationForm, focusDuration: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save AI Preferences
            </Button>
          </form>
        )}

        {/* 4. Appearance & System */}
        {activeTab === 'system' && (
          <div className="space-y-8">
            {/* Theme switcher */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
                <Sun className="h-5 w-5 text-indigo-500" />
                Appearance Settings
              </h3>
              
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Color Mode</h4>
                  <p className="text-xs font-semibold text-slate-400">Toggle between light and dark modes.</p>
                </div>
                
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  className="h-10 px-4 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                >
                  {theme === 'light' ? (
                    <>
                      <Sun className="h-4.5 w-4.5 text-amber-500" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4.5 w-4.5 text-indigo-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* System Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                Data & Seed Management
              </h3>
              
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Preload Master Curriculum</h4>
                  <p className="text-xs font-semibold text-slate-400">Populate the master course catalog to initialize roadmap options.</p>
                </div>

                <Button
                  onClick={() => setIsSeedModalOpen(true)}
                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Database className="h-4 w-4" />
                  Seed DB Catalog
                </Button>
              </div>
            </div>

            {/* Session */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b dark:border-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                Session
              </h3>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sign out</h4>
                  <p className="text-xs font-semibold text-slate-400">End your session on this device and return to the login screen.</p>
                </div>

                <form action={signOut}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 px-4 rounded-xl flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal for database seeding */}
      <ConfirmationDialog
        isOpen={isSeedModalOpen}
        title="Confirm Master Seeding"
        description="Are you sure you want to run the database seeder? This will reset and reload the default master university curriculum modules into the system database."
        onConfirm={handleRunSeed}
        onCancel={() => setIsSeedModalOpen(false)}
        isLoading={isSeeding}
        errorMsg={seedError}
        confirmText="Seed Database"
        isDanger={false}
      />
    </div>
  )
}
