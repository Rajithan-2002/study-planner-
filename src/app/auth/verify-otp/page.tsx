'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyOtp, resendVerification } from '@/app/auth/actions'
import { Mail, ArrowRight, RotateCcw, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  function handleChange(index: number, value: string) {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-advance
    if (digit && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 8 digits entered
    if (digit && index === 7 && newOtp.every(d => d !== '')) {
      submitOtp(newOtp.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '')
    if (pasted.length === 6 || pasted.length === 8) {
      const newOtp = [...otp]
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i]
      }
      setOtp(newOtp)
      inputRefs.current[pasted.length - 1]?.focus()
      submitOtp(pasted)
    }
  }

  async function submitOtp(token: string) {
    if (loading) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('email', email)
    formData.set('token', token)

    const res = await verifyOtp(formData)
    if (res?.error) {
      setError(res.error)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendSuccess(false)
    const res = await resendVerification(email)
    if (!res.error) {
      setResendSuccess(true)
      setCooldown(60)
    }
    setResendLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-white">Email Verified!</h2>
        <p className="text-slate-400 text-sm font-medium">Your workspace is ready. Redirecting...</p>
        <div className="h-1 w-32 mx-auto bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="text-center">
        <div className="inline-flex p-4 rounded-2xl bg-blue-500/20 text-blue-400 mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Check your email</h2>
        <p className="text-slate-400 text-sm font-medium mt-2">
          We sent a 6-digit code to
        </p>
        <p className="text-blue-400 font-bold text-sm mt-1 break-all">{email}</p>
      </div>

      {/* Error */}
      {error && (
        <div id="otp-error" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Resend Success */}
      {resendSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          New code sent! Check your inbox.
        </div>
      )}

      {/* OTP Input */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
          Enter verification code
        </label>
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-12 h-14 rounded-xl border text-center text-xl font-black text-white transition-all outline-none
                ${digit
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : 'border-slate-800 bg-slate-950/60'
                }
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
                disabled:opacity-50`}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        id="verify-otp-btn"
        type="button"
        onClick={() => submitOtp(otp.join(''))}
        disabled={loading || (otp.filter(Boolean).length !== 6 && otp.filter(Boolean).length !== 8)}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify & Enter Life OS
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Resend */}
      <div className="text-center">
        <button
          id="resend-otp-btn"
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendLoading}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCcw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : resendLoading ? 'Sending...' : 'Resend code'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-600">
        Wrong email?{' '}
        <Link href="/signup" className="text-blue-400 hover:underline font-semibold">
          Go back to signup
        </Link>
      </p>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden font-sans">

      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/30 mb-2">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center text-slate-400">Loading...</div>}>
            <VerifyOtpContent />
          </Suspense>
        </div>

      </div>
    </div>
  )
}
