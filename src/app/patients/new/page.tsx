'use client'

import { useState } from 'react'
import { createPatient } from '@/app/actions/patients'
import { motion } from 'framer-motion'
import { User, PawPrint, CheckCircle2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium ' +
  'focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all placeholder:text-muted-foreground/60'

export default function NewPatientPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage({ type: '', text: '' })

    const result = await createPatient(formData)

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Uğurla əlavə edildi!' })
      ;(document.getElementById('patientForm') as HTMLFormElement).reset()
    } else {
      setMessage({ type: 'error', text: result.error || 'Xəta baş verdi' })
    }

    setLoading(false)
  }

  return (
    <AppShell>
      <PageHeader
        title="Yeni Xəstə"
        highlight="Qeydiyyatı"
        subtitle="Heyvan sahibi və pasiyent məlumatlarını daxil edin — çip skaneri dəstəklənir"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="max-w-3xl"
      >
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="p-6 sm:p-10">
            {message.text && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl mb-8 flex items-center gap-3 border ${
                  message.type === 'success'
                    ? 'bg-success/10 text-success border-success/25'
                    : 'bg-destructive/10 text-destructive border-destructive/25'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                )}
                <p className="font-semibold text-sm">{message.text}</p>
              </motion.div>
            )}

            <form id="patientForm" action={handleSubmit} className="space-y-10">

              {/* Sahibin məlumatları */}
              <div>
                <h2 className="text-lg font-display font-extrabold mb-4 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  Heyvan Sahibinin Məlumatları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-secondary/50 p-5 rounded-xl border border-border">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Ad və Soyad <span className="text-destructive">*</span>
                    </label>
                    <input type="text" name="ownerName" required className={inputCls} placeholder="Məs: Əzizov Rüfət" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      WhatsApp Nömrəsi <span className="text-destructive">*</span>
                    </label>
                    <input type="tel" name="ownerPhone" required className={inputCls} placeholder="+99455..." />
                  </div>
                </div>
              </div>

              {/* Heyvanın məlumatları */}
              <div>
                <h2 className="text-lg font-display font-extrabold mb-4 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <PawPrint className="w-4.5 h-4.5" />
                  </span>
                  Xəstə (Heyvan) Məlumatları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-secondary/50 p-5 rounded-xl border border-border">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Heyvanın Adı <span className="text-destructive">*</span>
                    </label>
                    <input type="text" name="patientName" required className={inputCls} placeholder="Məs: Max, Bella" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Növü <span className="text-destructive">*</span>
                    </label>
                    <select name="species" required className={`${inputCls} cursor-pointer`}>
                      <option value="">Siyahıdan seçin...</option>
                      <option value="İt">İt</option>
                      <option value="Pişik">Pişik</option>
                      <option value="Quş">Quş</option>
                      <option value="Sürünən">Sürünən</option>
                      <option value="Digər">Digər</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Cinsi (Törəmə)</label>
                    <input type="text" name="breed" className={inputCls} placeholder="Məs: Qızıl Retriver, Van pişiyi" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">Çip / Barkod Nömrəsi</label>
                    <input
                      type="text"
                      name="chipNumber"
                      className={`${inputCls} border-primary/40 bg-primary-soft/50 font-mono focus:ring-ring/40`}
                      placeholder="Skanerlə oxudun..."
                    />
                    <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Avtomatik oxutma üçün kursoru bu xanaya qoyub RFID cihazını işə salın.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2.5 transition-all ${
                  loading
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground shadow-glow hover:brightness-110'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Bazaya yüklənir...
                  </>
                ) : (
                  <>
                    <PawPrint className="w-5 h-5" /> Xəstəni Qeydiyyata Al
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </AppShell>
  )
}
