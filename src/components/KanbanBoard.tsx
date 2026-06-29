'use client'

import { useState } from 'react'
import { updatePatientStatus } from '@/app/actions/kanban'
import Link from 'next/link'

type Patient = {
  id: string
  name: string
  species: string
  breed: string | null
  clinicStatus: string
  owner: {
    firstName: string
    phone: string
  }
}

const COLUMNS = [
  { id: 'WAITING', title: 'Gözləmə Zalı', icon: '🛋️', color: 'bg-amber-50/40', borderColor: 'border-amber-200/60', headerBg: 'bg-amber-500 text-white shadow-amber-500/20' },
  { id: 'EXAMINATION', title: 'Müayinədədir', icon: '🩺', color: 'bg-emerald-50/40', borderColor: 'border-emerald-200/60', headerBg: 'bg-emerald-600 text-white shadow-emerald-600/20' },
  { id: 'TREATMENT', title: 'Stasionar / Müalicə', icon: '🏥', color: 'bg-teal-50/40', borderColor: 'border-teal-200/60', headerBg: 'bg-teal-700 text-white shadow-teal-700/20' },
  { id: 'DISCHARGED', title: 'Evə Buraxıldı', icon: '✅', color: 'bg-slate-100/50', borderColor: 'border-slate-200/60', headerBg: 'bg-slate-800 text-white shadow-slate-800/20' }
]

export default function KanbanBoard({ initialPatients }: { initialPatients: Patient[] }) {
  const [patients, setPatients] = useState(initialPatients)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    if (!draggedId) return

    setPatients(prev => prev.map(p => p.id === draggedId ? { ...p, clinicStatus: statusId } : p))
    setDraggedId(null)

    await updatePatientStatus(draggedId, statusId)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-2">
      {COLUMNS.map(column => {
        const columnPatients = patients.filter(p => p.clinicStatus === column.id)
        
        return (
          <div 
            key={column.id} 
            className={`w-full rounded-[2rem] border ${column.borderColor} ${column.color} flex flex-col shadow-lg backdrop-blur-md h-[580px] transition-all`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header */}
            <div className={`p-4 rounded-t-[2rem] ${column.headerBg} flex justify-between items-center shadow-md`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl drop-shadow-sm flex-shrink-0">{column.icon}</span>
                <span className="text-sm font-black tracking-tight truncate">{column.title}</span>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-black shadow-inner border border-white/20 flex-shrink-0">
                {columnPatients.length}
              </span>
            </div>

            {/* Cards Area */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {columnPatients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <div className="text-4xl mb-1 grayscale">📥</div>
                  <p className="text-[11px] font-bold tracking-wider uppercase">Bura boşdur</p>
                </div>
              ) : (
                columnPatients.map(patient => (
                  <div
                    key={patient.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, patient.id)}
                    className={`bg-white p-4 rounded-[1.6rem] shadow-sm hover:shadow-xl cursor-grab active:cursor-grabbing border border-slate-200/70 transition-all hover:-translate-y-0.5 relative group ${draggedId === patient.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2.5 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                          {patient.species === 'Pişik' ? '🐱' : patient.species === 'İt' ? '🐶' : '🦜'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md border border-emerald-200/60 uppercase tracking-wider">
                              {patient.species}
                            </span>
                            {patient.breed && <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{patient.breed}</span>}
                          </div>
                          <h3 className="font-black text-slate-900 text-base tracking-tight truncate">
                            {patient.name}
                          </h3>
                        </div>
                      </div>

                      <Link 
                        href={`/patients/${patient.id}`}
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex-shrink-0"
                        title="Bədən Xəritəsi & SOAP Müayinə"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                      </Link>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-800 flex items-center justify-center text-white font-black text-[10px] shadow-sm flex-shrink-0">
                          {patient.owner.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold leading-none mb-0.5">Sahibi</p>
                          <p className="text-[11px] font-bold text-slate-800 truncate">{patient.owner.firstName} <span className="text-[10px] font-semibold text-emerald-700">({patient.owner.phone})</span></p>
                        </div>
                      </div>

                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                        Aktiv 🩺
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
