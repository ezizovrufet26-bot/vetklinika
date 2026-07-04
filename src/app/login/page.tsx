'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Stethoscope, Mail, Lock, LogIn, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { login, type LoginState } from '@/app/actions/auth'
import ThemeToggle from '@/components/ui/theme-toggle'
import RegisterRequestModal from '@/components/RegisterRequestModal'

const inputWrapCls =
  'flex items-center gap-3 bg-secondary/60 border border-input rounded-xl px-4 ' +
  'focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring transition-all'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {})
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

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
            Sistemə Giriş
          </h1>
          <p className="text-sm text-muted-foreground font-medium text-center mt-2 mb-8">
            Email və ya telefon nömrənizlə daxil olun
          </p>

          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Email və ya Telefon
              </label>
              <div className={inputWrapCls}>
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="ad@email.com və ya 51 377 90 99"
                  className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full placeholder:text-muted-foreground/50 placeholder:font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Parol
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-bold transition-all">
                  Şifrəni unutmusunuz?
                </Link>
              </div>
              <div className={inputWrapCls}>
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="bg-transparent py-3.5 text-sm font-semibold outline-none w-full placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {state.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {state.error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={pending}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2.5"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" /> Yoxlanılır...
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" /> Daxil Ol
                </>
              )}
            </motion.button>
          </form>

          <div className="flex items-center gap-2 justify-center mt-7 text-[11px] font-bold text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Bütün sessiyalar şifrələnmiş və HttpOnly cookie ilə qorunur
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground font-semibold mt-6">
          Hesabınız yoxdur?{' '}
          <button onClick={() => setIsRegisterOpen(true)} className="text-primary hover:underline font-bold transition-all">
            Qeydiyyat üçün müraciət göndərin
          </button>
        </p>
      </motion.div>

      <RegisterRequestModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  )
}
