'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Check, ChevronDown, Sparkles } from 'lucide-react'

interface Clinic {
  id: string
  name: string
  isDefault?: boolean
}

const DEFAULT_CLINICS: Clinic[] = [
  { id: 'clinic-1', name: '🏥 Mərkəz Baytarlıq Klinikası (Demo)', isDefault: true },
  { id: 'clinic-2', name: '🐾 Bakı Pet Care Mərkəzi' },
  { id: 'clinic-3', name: '🌿 Dost Baytarlıq Klinikası' }
]

export default function ClinicSwitcher() {
  const [clinics, setClinics] = useState<Clinic[]>(DEFAULT_CLINICS)
  const [activeClinic, setActiveClinic] = useState<Clinic>(DEFAULT_CLINICS[0])
  const [isOpen, setIsOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClinicName, setNewClinicName] = useState('')

  useEffect(() => {
    const savedClinics = localStorage.getItem('vet_clinics_list')
    const savedActiveId = localStorage.getItem('vet_active_clinic_id')

    let currentClinics = DEFAULT_CLINICS
    if (savedClinics) {
      try {
        currentClinics = JSON.parse(savedClinics)
        setClinics(currentClinics)
      } catch (e) {
        console.error(e)
      }
    }

    if (savedActiveId) {
      const found = currentClinics.find(c => c.id === savedActiveId)
      if (found) setActiveClinic(found)
    }
  }, [])

  const handleSelectClinic = (clinic: Clinic) => {
    setActiveClinic(clinic)
    localStorage.setItem('vet_active_clinic_id', clinic.id)
    localStorage.setItem('vet_active_clinic_name', clinic.name)
    window.dispatchEvent(new Event('clinicChange'))
    setIsOpen(false)
  }

  const handleCreateClinic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClinicName.trim()) return

    const newClinic: Clinic = {
      id: 'clinic-' + Date.now(),
      name: newClinicName.trim()
    }

    const updated = [...clinics, newClinic]
    setClinics(updated)
    localStorage.setItem('vet_clinics_list', JSON.stringify(updated))
    handleSelectClinic(newClinic)
    setNewClinicName('')
    setShowAddModal(false)
  }

  return (
    <div className="relative z-50">
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-100 rounded-2xl border border-emerald-500/30 backdrop-blur-md transition-all text-xs font-bold shadow-sm"
      >
        <Building2 className="w-4 h-4 text-emerald-400" />
        <span className="max-w-[160px] truncate">{activeClinic.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>Klinika / Filial Seçin</span>
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 py-1">
            {clinics.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClinic(c)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeClinic.id === c.id
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{c.name}</span>
                {activeClinic.id === c.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setIsOpen(false)
              setShowAddModal(true)
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Yeni Müştəri / Klinika Yarat
          </button>
        </div>
      )}

      {/* Add New Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                🏢
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Yeni Müştəri / Klinika Əlavə Et</h3>
                <p className="text-xs text-slate-500">Müstəqil və təmiz iş sahəsi yaradılacaq</p>
              </div>
            </div>

            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Klinikanın / Filialın Adı</label>
                <input
                  type="text"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  placeholder="Məs: Sumqayıt Pet Hospital"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  ➕ Əlavə Et Və KeçiD Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
