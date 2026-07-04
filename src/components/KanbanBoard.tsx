'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updatePatientStatus } from '@/app/actions/kanban'
import Link from 'next/link'
import { Sofa, Stethoscope, BedDouble, CheckCircle2, Inbox, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { id: 'WAITING', title: 'Gözləmə Zalı', icon: Sofa, accent: 'text-warning', headerBg: 'bg-warning/10 border-warning/20' },
  { id: 'EXAMINATION', title: 'Müayinədədir', icon: Stethoscope, accent: 'text-primary', headerBg: 'bg-primary-soft border-primary/20' },
  { id: 'TREATMENT', title: 'Stasionar / Müalicə', icon: BedDouble, accent: 'text-info', headerBg: 'bg-info/10 border-info/20' },
  { id: 'DISCHARGED', title: 'Evə Buraxıldı', icon: CheckCircle2, accent: 'text-success', headerBg: 'bg-success/10 border-success/20' },
]

const speciesEmoji = (species: string) =>
  species === 'Pişik' ? '🐱' : species === 'İt' ? '🐶' : '🦜'

export default function KanbanBoard({ initialPatients }: { initialPatients: Patient[] }) {
  const [patients, setPatients] = useState(initialPatients)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    if (!draggedId) return

    setPatients(prev => prev.map(p => (p.id === draggedId ? { ...p, clinicStatus: statusId } : p)))
    setDraggedId(null)

    await updatePatientStatus(draggedId, statusId)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full pt-2">
      {COLUMNS.map(column => {
        const columnPatients = patients.filter(p => p.clinicStatus === column.id)
        const Icon = column.icon

        return (
          <div
            key={column.id}
            className={cn(
              'w-full rounded-2xl border bg-card/60 flex flex-col h-[580px] transition-all duration-300 shadow-soft',
              dragOverCol === column.id
                ? 'border-primary/50 shadow-glow'
                : 'border-border'
            )}
            onDragOver={e => handleDragOver(e, column.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, column.id)}
          >
            {/* Sütun başlığı */}
            <div className={cn('m-3 mb-0 p-3.5 rounded-xl border flex justify-between items-center', column.headerBg)}>
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('w-4.5 h-4.5 shrink-0', column.accent)} />
                <span className="text-sm font-extrabold tracking-tight truncate">{column.title}</span>
              </div>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-card border border-border', column.accent)}>
                {columnPatients.length}
              </span>
            </div>

            {/* Kartlar */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {columnPatients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-[11px] font-bold tracking-wider uppercase">Bura boşdur</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {columnPatients.map(patient => (
                    <motion.div
                      key={patient.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      draggable
                      // framer-motion onDragStart-ı öz pan-drag sisteminə yönləndirir,
                      // ona görə HTML5 dragstart-ı capture fazasında tuturuq
                      onDragStartCapture={(e: React.DragEvent) => handleDragStart(e, patient.id)}
                      className={cn(
                        'bg-card p-4 rounded-xl border border-border shadow-soft hover:shadow-premium',
                        'cursor-grab active:cursor-grabbing transition-shadow group',
                        draggedId === patient.id && 'opacity-40 scale-95'
                      )}
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/15 flex items-center justify-center text-xl shrink-0">
                            {speciesEmoji(patient.species)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-primary-soft text-primary rounded-md border border-primary/15 uppercase tracking-wider">
                                {patient.species}
                              </span>
                              {patient.breed && (
                                <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">
                                  {patient.breed}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-base tracking-tight truncate">{patient.name}</h3>
                          </div>
                        </div>

                        <Link
                          href={`/patients/${patient.id}`}
                          className="p-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                          title="Bədən Xəritəsi & SOAP Müayinə"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="border-t border-border pt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-extrabold text-[10px] shrink-0">
                            {patient.owner.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold leading-none mb-0.5">
                              Sahibi
                            </p>
                            <p className="text-[11px] font-bold truncate">
                              {patient.owner.firstName}{' '}
                              <span className="text-[10px] font-semibold text-primary">({patient.owner.phone})</span>
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-extrabold px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
                          Aktiv
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
