'use client'

import { useState } from 'react'
import { Save, Thermometer, Scale, Sparkles } from 'lucide-react'
import { addVisit, generateSoapDraft } from '@/app/actions/visits'

const inputCls =
  'w-full bg-secondary/50 border border-input rounded-xl p-3.5 text-xs font-medium text-foreground ' +
  'focus:ring-2 focus:ring-ring/30 focus:bg-card outline-none transition-all placeholder:text-muted-foreground/60'

const soapBadge = (letter: string, cls: string) => (
  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-extrabold ${cls}`}>{letter}</span>
)

export default function VisitForm({
  patientId,
  species,
  patientName,
}: {
  patientId: string
  species: string
  patientName: string
}) {
  const [reason, setReason] = useState('')
  const [temperature, setTemperature] = useState('')
  const [weight, setWeight] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const handleAiDraft = async () => {
    setAiLoading(true)
    setAiError('')
    const result = await generateSoapDraft({
      species,
      patientName,
      reason,
      temperature: temperature ? parseFloat(temperature) : null,
      weight: weight ? parseFloat(weight) : null,
    })
    if (result.error) {
      setAiError(result.error)
    } else if (result.draft) {
      setDoctorNotes(result.draft)
    }
    setAiLoading(false)
  }

  return (
    <form action={addVisit.bind(null, patientId)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {soapBadge('S', 'bg-warning/10 text-warning')} Subyektiv (Şikayət)
          </label>
          <textarea
            name="reason" required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${inputCls} h-28`}
            placeholder="Heyvan sahibi nədən şikayətlənir?"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {soapBadge('O', 'bg-info/10 text-info')} Obyektiv (Göstəricilər)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Thermometer className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number" step="0.1" name="temperature"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className={`${inputCls} pl-8`} placeholder="Temp (°C)"
              />
            </div>
            <div className="relative">
              <Scale className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number" step="0.1" name="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`${inputCls} pl-8`} placeholder="Çəki (KQ)"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {soapBadge('A', 'bg-accent/10 text-accent')} Assessment (Diaqnoz)
            </label>
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={aiLoading || !reason.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-soft text-primary text-[11px] font-bold rounded-lg hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> {aiLoading ? 'Yazılır...' : 'AI ilə qaralama yaz'}
            </button>
          </div>
          <textarea
            name="doctorNotes"
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className={`${inputCls} h-28`}
            placeholder="İlkin və ya dəqiq diaqnoz..."
          />
          {aiError && <p className="text-[11px] text-destructive font-medium">{aiError}</p>}
          {!aiError && (
            <p className="text-[10px] text-muted-foreground">
              AI qaralama yalnız təklifdir — yadda saxlamazdan əvvəl mütləq özünüz yoxlayıb düzəldin.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {soapBadge('P', 'bg-primary-soft text-primary')} Plan (Müalicə)
          </label>
          <textarea
            name="treatment"
            className={`${inputCls} h-28`}
            placeholder="Yazılan dərmanlar və müalicə planı..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 active:scale-[0.99] transition-all flex justify-center items-center gap-2"
      >
        <Save className="w-4 h-4" /> Tibbi Qeydi Yaddaşa Ver
      </button>
    </form>
  )
}
