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
  { id: 'WAITING', title: 'Gözləmə Zalı', icon: '🛋️', color: 'bg-amber-50/50', borderColor: 'border-amber-200/80', headerBg: 'bg-amber-500 text-white shadow-amber-500/20' },
  { id: 'EXAMINATION', title: 'Müayinədədir', icon: '🩺', color: 'bg-blue-50/50', borderColor: 'border-blue-200/80', headerBg: 'bg-blue-600 text-white shadow-blue-600/20' },
  { id: 'TREATMENT', title: 'Stasionar / Müalicə', icon: '🏥', color: 'bg-purple-50/50', borderColor: 'border-purple-200/80', headerBg: 'bg-purple-600 text-white shadow-purple-600/20' },
  { id: 'DISCHARGED', title: 'Evə Buraxıldı', icon: '✅', color: 'bg-emerald-50/50', borderColor: 'border-emerald-200/80', headerBg: 'bg-emerald-600 text-white shadow-emerald-600/20' }
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
    <div className="flex gap-6 overflow-x-auto pb-8 pt-2 snap-x snap-mandatory hide-scrollbar">
      {COLUMNS.map(column => {
        const columnPatients = patients.filter(p => p.clinicStatus === column.id)
        
        return (
          <div 
            key={column.id} 
            className={`flex-shrink-0 w-80 md:w-[24.5rem] rounded-[2.5rem] border ${column.borderColor} ${column.color} flex flex-col snap-center shadow-xl backdrop-blur-md h-[70vh] transition-all`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header */}
            <div className={`p-5 rounded-t-[2.5rem] ${column.headerBg} flex justify-between items-center shadow-lg`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-sm">{column.icon}</span>
                <span className="text-base font-black tracking-tight">{column.title}</span>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black shadow-inner border border-white/20">
                {columnPatients.length}
              </span>
            </div>

            {/* Cards Area */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {columnPatients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <div className="text-5xl mb-2 grayscale">📥</div>
                  <p className="text-xs font-bold tracking-wider uppercase">Bura boşdur</p>
                </div>
              ) : (
                columnPatients.map(patient => (
                  <div
                    key={patient.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, patient.id)}
                    className={`bg-white p-5 rounded-[2rem] shadow-md hover:shadow-2xl cursor-grab active:cursor-grabbing border border-slate-200/70 transition-all hover:-translate-y-1 relative group ${draggedId === patient.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                            {patient.species}
                          </span>
                          {patient.breed && <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">{patient.breed}</span>}
                        </div>
                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                          {patient.species === 'Pişik' ? '🐱' : patient.species === 'İt' ? '🐶' : '🐾'} {patient.name}
                        </h3>
                      </div>
                      <Link 
                        href={`/patients/${patient.id}`}
                        className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:scale-105"
                        title="Bədən Xəritəsi & SOAP"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                      </Link>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                        {patient.owner.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Sahibi & Əlaqə</p>
                        <p className="text-xs font-bold text-slate-700">{patient.owner.firstName} <span className="text-[11px] font-normal text-slate-400">({patient.owner.phone})</span></p>
                      </div>
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
