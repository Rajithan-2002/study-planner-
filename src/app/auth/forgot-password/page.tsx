'use client'

import { useState } from 'react'
import { forgotPassword } from '@/app/auth/actions'
import { Mail, ArrowRight, AlertCircle, CheckCircle2, GraduationCap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const email = formData.get('email') as string
    const res = await forgotPassword(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      setSentEmail(email)
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden font-sans">

      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/30 mb-2">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-2xl p-8 shadow-2xl">

          {success ? (
            <div className="text-center space-y-5">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Check your inbox</h2>
                <p className="text-slate-400 text-sm font-medium mt-2">
                  We sent a password reset link to
                </p>
                <p className="text-blue-400 font-bold text-sm mt-1">{sentEmail}</p>
              </div>
              <p className="text-xs text-slate-500">
                Click the link in the email to reset your password. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white">Forgot password?</h2>
                <p className="text-slate-400 text-sm font-medium mt-2">
                  No worries — we'll send you a reset link to your email.
                </p>
              </div>

              {error && (
                <div id="forgot-password-error" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs font-semibold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form action={handleSubmit} className="space-y-4">
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
                      autoFocus
                      placeholder="name@university.edu"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                    />
                  </div>
                </div>

                <button
                  id="send-reset-link-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
