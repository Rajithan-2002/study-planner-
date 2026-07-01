'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signup, signInWithGoogle } from '@/app/auth/actions'
import { GraduationCap, ArrowRight, Lock, Mail, User, Building2, Calendar, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getStrength()
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? colors[strength] : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength <= 2 ? 'text-red-400' : strength <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {labels[strength]}
      </p>
    </div>
  )
}

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR + i)

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const res = await signup(formData)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.redirectTo) {
      router.push(res.redirectTo)
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch {
      setError('Failed to initiate Google sign up. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden font-sans">

      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-7 relative z-10 py-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-2xl shadow-violet-600/30 mb-2">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Build your personal academic OS — AI-powered, fully personalized.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-2xl p-8 shadow-2xl space-y-5">

          {/* Error */}
          {error && (
            <div id="signup-error" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            id="google-signup-btn"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/60 text-white text-sm font-semibold hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <div className="h-5 w-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium">or sign up with email</span>
            </div>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Rajithan Pathmanathan"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@university.edu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                />
              </div>
            </div>

            {/* University + Graduation Year Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="university" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  University
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="university"
                    name="university"
                    type="text"
                    placeholder="State University"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-3 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="graduationYear" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Grad Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <select
                    id="graduationYear"
                    name="graduationYear"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-3 py-3 text-sm font-medium text-white focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all appearance-none cursor-pointer"
                  >
                    {GRAD_YEARS.map(y => (
                      <option key={y} value={y} className="bg-slate-900">{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-11 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2 py-1">
              {['AI Planning Engine', 'Smart Scheduler', 'Memory System', 'Habit Tracker'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account — It's Free
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
