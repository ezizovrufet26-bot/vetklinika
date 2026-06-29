'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Dog, Cat, Bird, Rabbit } from 'lucide-react'

export default function BodyMap({ species }: { species: string }) {
  const [activeZone, setActiveZone] = useState<string | null>(null)

  const zones = [
    { id: 'head', name: 'Baş və Boyun', top: '20%', left: '25%' },
    { id: 'chest', name: 'Döş Qəfəsi', top: '40%', left: '40%' },
    { id: 'abdomen', name: 'Qarın Boşluğu', top: '45%', left: '60%' },
    { id: 'front-legs', name: 'Ön Ayaqlar', top: '75%', left: '35%' },
    { id: 'back-legs', name: 'Arxa Ayaqlar', top: '75%', left: '70%' },
    { id: 'tail', name: 'Quyruq', top: '35%', left: '85%' },
  ]

  return (
    <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl h-[500px] border border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e51a_1px,transparent_1px),linear-gradient(to_bottom,#4f46e51a_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-emerald-400 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Bio-Skan: Aktivləşdirildi
        </h3>
        
        <div className="flex-1 relative mt-4">
          {/* Animal Silhouette Area */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 mix-blend-screen">
            {species === 'Pişik' && <Image src="/cat_blueprint.png" alt="Cat Blueprint" fill className="object-contain p-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" priority />}
            {species === 'İt' && <Image src="/dog_blueprint.png" alt="Dog Blueprint" fill className="object-contain p-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" priority />}
            {(!['Pişik', 'İt'].includes(species)) && <div className="text-indigo-500/30 text-2xl font-bold tracking-[1em]">SCANNING...</div>}
          </div>

          {/* Clickable Zones */}
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className="absolute w-12 h-12 -ml-6 -mt-6 group focus:outline-none"
              style={{ top: zone.top, left: zone.left }}
            >
              <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                activeZone === zone.id 
                  ? 'border-emerald-400 scale-125 bg-emerald-400/20' 
                  : 'border-indigo-400 bg-indigo-500/10 group-hover:scale-110 group-hover:border-indigo-300'
              }`}></div>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                activeZone === zone.id ? 'bg-emerald-400' : 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]'
              }`}></div>
              
              {/* Tooltip */}
              <div className={`absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-xs font-mono text-white rounded whitespace-nowrap border transition-all duration-300 ${
                activeZone === zone.id ? 'border-emerald-500 opacity-100' : 'border-indigo-500/50 opacity-0 group-hover:opacity-100'
              }`}>
                [{zone.name}]
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto flex justify-between items-end border-t border-slate-800 pt-4">
          <div>
            <p className="text-slate-500 text-xs font-mono">Növü</p>
            <p className="text-indigo-300 font-bold tracking-wider uppercase">{species}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs font-mono">Status</p>
            <p className="text-emerald-400 font-mono text-sm">Müayinəyə Hazırdır</p>
          </div>
        </div>
      </div>
    </div>
  )
}
