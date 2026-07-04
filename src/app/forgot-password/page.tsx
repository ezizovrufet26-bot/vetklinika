'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Stethoscope, Mail, Lock, Key, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { sendResetOtp, resetPassword } from '@/app/actions/auth'
import ThemeToggle from '@/components/ui/theme-toggle'

const inputWrapCls =
  'flex items-center gap-3 bg-secondary/60 border border-input rounded-xl px-4 ' +
  'focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring transition-all'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [identifier, setIdentifier] = useState('')
  const [userId, setUserId] = useState('')
  const [code, setCode] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ success: '', error: '' })

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ success: '', error: '' })

    try {
      const res = await sendResetOtp(identifier)
      if (res.error) {
        setMessage({ success: '', error: res.error })
      } else {
        setMessage({ success: res.success || 'Kod göndərildi.', error: '' })
        setUserId(res.userId || '')
        setStep(2)
      }
    } catch (err) {
      setMessage({ success: '', error: 'Gözlənilməz xəta baş verdi.' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setMessage({ success: '', error: 'Şifrələr uyğun gəlmir.' })
      return
    }
    
    setLoading(true)
    setMessage({ success: '', error: '' })

    try {
      const res = await resetPassword({ userId, code, newPass })
      if (res.error) {
        setMessage({ success: '', error: res.error })
      } else {
        setMessage({ success: res.success || 'Şifrəniz sıfırlandı.', error: '' })
        // Clear inputs
        setCode('')
        setNewPass('')
        setConfirmPass('')
        // Optionally redirect or show success step
        setStep(2) // keep at 2 but with success message
      }
    } catch (err) {
      setMessage({ success: '', error: 'Gözlənilməz xəta baş verdi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-aurora relative flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid -z-10" />
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-md"
      >
        {/* Brend */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-glow">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold tracking-tight">
              Vet<span className="text-primary">Klinika</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Clinical OS
            </span>
          </div>
        </Link>

        <div className="glass-panel rounded-3xl shadow-premium p-8 sm:p-10">
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-center">
            {step === 1 ? 'Şifrəni Sıfırla' : 'Yeni Şifrə Təyin Et'}
          </h1>
          <p className="text-sm text-muted-foreground font-medium text-center mt-2 mb-8">
            {step === 1 
              ? 'Təhlükəsizlik kodunun göndərilməsi üçün email və ya nömrənizi yazın' 
              : 'WhatsApp və ya emailinizə gələn 6 rəqəmli kodu daxil edin'}
          </p>

          {message.error && (
            <div className="mb-5 p-4 bg-destructive/10 text-destructive text-xs font-bold rounded-xl border border-destructive/25 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {message.error}
            </div>
          )}

          {message.success && (
            <div className="mb-5 p-4 bg-success/10 text-success text-xs font-bold rounded-xl border border-success/25 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {message.success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Email və ya Telefon
                </label>
                <div className={inputWrapCls}>
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Məs: ad@email.com və ya 51 377 90 99"
                    className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full placeholder:text-muted-foreground/50 placeholder:font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2.5"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Kod Göndər'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  6 Rəqəmli Kod (OTP)
                </label>
                <div className={inputWrapCls}>
                  <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Yeni Şifrə
                </label>
                <div className={inputWrapCls}>
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Yeni Şifrə (Təkrar)
                </label>
                <div className={inputWrapCls}>
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || message.success.includes('sıfırlandı')}
                className="w-full py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2.5"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Şifrəni Yenilə'}
              </button>

              {message.success.includes('sıfırlandı') && (
                <Link
                  href="/login"
                  className="w-full py-4 bg-secondary text-foreground font-extrabold text-sm rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2.5"
                >
                  Giriş Səhifəsinə Keç →
                </Link>
              )}
            </form>
          )}

          <div className="flex items-center justify-center mt-7">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary font-bold flex items-center gap-1.5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Geri qayıt
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
