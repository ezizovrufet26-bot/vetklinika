'use client'

import { useState } from 'react'
import { FilePlus, Loader2, X } from 'lucide-react'
import { addLabResult } from '@/app/actions/diagnostics'

interface ManualLabResultModalProps {
  patients: { id: string; name: string; species: string; owner?: { firstName: string } }[]
}

export default function ManualLabResultModal({ patients }: ManualLabResultModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const formData = new FormData(e.currentTarget)
    
    try {
      // Build a minimal fake HL7 / JSON structure based on the inputs
      const testType = formData.get('testType') as 'HEMATOLOGY' | 'BIOCHEMISTRY'
      
      const dataObj: Record<string, string> = {}
      if (testType === 'HEMATOLOGY') {
        dataObj.WBC = formData.get('wbc') as string
        dataObj.RBC = formData.get('rbc') as string
        dataObj.HGB = formData.get('hgb') as string
      } else {
        dataObj.ALT = formData.get('alt') as string
        dataObj.AST = formData.get('ast') as string
        dataObj.CREA = formData.get('crea') as string
      }

      await addLabResult({
        patientId: formData.get('patientId') as string,
        deviceName: formData.get('deviceName') as string || 'Əllə Daxil Edilmiş',
        testType,
        dataJson: JSON.stringify(dataObj)
      })
      
      setIsOpen(false)
    } catch (error) {
      setMessage('Xəta baş verdi. Məlumatları yoxlayın.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 h-11 px-5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-premium hover:bg-indigo-700 transition-all"
      >
        <FilePlus className="w-4 h-4" /> Əllə Qan Analizi Əlavə Et
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto py-10">
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-border mt-auto mb-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-extrabold flex items-center gap-2 text-indigo-700">
                🩸 Laboratoriya Nəticəsi Əlavə Et
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-secondary text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && <div className="mb-4 text-sm font-bold text-destructive">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Pasiyent Seçin</label>
                <select required name="patientId" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-indigo-500">
                  <option value="">Siyahıdan seçin...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species}) - Sahib: {p.owner?.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Test Növü</label>
                <select required name="testType" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-indigo-500"
                  onChange={(e) => {
                    const type = e.target.value
                    document.getElementById('hematology-fields')!.style.display = type === 'HEMATOLOGY' ? 'block' : 'none'
                    document.getElementById('biochemistry-fields')!.style.display = type === 'BIOCHEMISTRY' ? 'block' : 'none'
                  }}
                >
                  <option value="HEMATOLOGY">Hematologiya (Qanın Ümumi Analizi)</option>
                  <option value="BIOCHEMISTRY">Biokimya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Cihaz / Laboratoriya Adı</label>
                <input required name="deviceName" type="text" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-indigo-500" defaultValue="Xarici Laboratoriya" />
              </div>

              <div id="hematology-fields" className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hematologiya Parametrləri</h4>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">WBC</label>
                  <input name="wbc" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 12.5" />
                  <span className="w-12 text-[10px] text-slate-400">10^9/L</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">RBC</label>
                  <input name="rbc" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 5.8" />
                  <span className="w-12 text-[10px] text-slate-400">10^12/L</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">HGB</label>
                  <input name="hgb" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 140" />
                  <span className="w-12 text-[10px] text-slate-400">g/L</span>
                </div>
              </div>

              <div id="biochemistry-fields" className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3" style={{display: 'none'}}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Biokimya Parametrləri</h4>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">ALT</label>
                  <input name="alt" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 45" />
                  <span className="w-12 text-[10px] text-slate-400">U/L</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">AST</label>
                  <input name="ast" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 35" />
                  <span className="w-12 text-[10px] text-slate-400">U/L</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="w-16 text-xs font-bold text-slate-700">CREA</label>
                  <input name="crea" type="text" className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="Məs: 1.2" />
                  <span className="w-12 text-[10px] text-slate-400">mg/dL</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 py-4 bg-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-glow hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sistemə Yüklə'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
