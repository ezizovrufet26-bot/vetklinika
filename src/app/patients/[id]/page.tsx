import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import BodyMap from '@/components/BodyMap'
import AiVoiceAssistant from '@/components/AiVoiceAssistant'
import DiagnosticViewer from '@/components/DiagnosticViewer'
import LabResultsTable from '@/components/LabResultsTable'
import DeviceIntegrationSimulator from '@/components/DeviceIntegrationSimulator'
import { addVisit } from '@/app/actions/visits'

export default async function PatientRecord({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const patient = await prisma.patient.findUnique({
    where: { id: resolvedParams.id },
    include: {
      owner: true,
      visits: { orderBy: { visitDate: 'desc' } },
      diagnosticImages: { orderBy: { createdAt: 'desc' } },
      labResults: { orderBy: { createdAt: 'desc' } }
    }
  })

  if (!patient) notFound()

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 font-sans text-slate-800 relative overflow-x-hidden">
      {/* Global Noise & Geometric Accent Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.025] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>

      {/* Top Floating Header */}
      <div className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-2xl transition-all border border-slate-200/60">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[11px] rounded-lg uppercase tracking-wider">
                  {patient.species}
                </span>
                <span className="text-xs font-semibold text-slate-400">Çip: {patient.chipNumber || 'Yoxdur'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                {patient.species === 'Pişik' ? '🐱' : patient.species === 'İt' ? '🐶' : '🐾'} 
                {patient.name}
              </h1>
            </div>
          </div>

          <div className="text-right bg-white px-5 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sahibi & Əlaqə</p>
            <p className="font-extrabold text-sm text-slate-800">{patient.owner.firstName} <span className="font-medium text-slate-500">({patient.owner.phone})</span></p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hardware Integration Test Simulator */}
        <DeviceIntegrationSimulator patientId={patient.id} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Body Map & Diagnostics */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>📍</span> Qabaqcıl Anatomik Bədən Xəritəsi
              </h2>
              <BodyMap species={patient.species} />
            </div>

            <DiagnosticViewer images={patient.diagnosticImages as any} patientId={patient.id} />
            <AiVoiceAssistant />
          </div>

          {/* Right Column: S.O.A.P Form & Labs */}
          <div className="lg:col-span-7 space-y-6">
            
            <LabResultsTable labResults={patient.labResults as any} />

            {/* Shepherd-Style S.O.A.P Clinical Form */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/80 overflow-hidden p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg uppercase tracking-wider mb-1">
                    Klinik Müayinə
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">S.O.A.P. Tibbi Qeyd Paneli</h2>
                </div>
                <div className="flex gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">S</span>
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">O</span>
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">A</span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">P</span>
                </div>
              </div>
              
              <form action={addVisit.bind(null, patient.id)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-black">S</span> 
                      Subyektiv (Şikayət)
                    </label>
                    <textarea 
                      name="reason" required
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all h-28"
                      placeholder="Heyvan sahibi nədən şikayətlənir?"
                    ></textarea>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-black">O</span> 
                      Obyektiv (Göstəricilər)
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input 
                        type="number" step="0.1" name="temperature" 
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Temp (°C)"
                      />
                      <input 
                        type="number" step="0.1" name="weight" 
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Çəki (KQ)"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-black">A</span> 
                      Assessment (Diaqnoz)
                    </label>
                    <textarea 
                      name="doctorNotes" 
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all h-28"
                      placeholder="İlkin və ya dəqiq diaqnoz..."
                    ></textarea>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">P</span> 
                      Plan (Müalicə)
                    </label>
                    <textarea 
                      name="treatment" 
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all h-28"
                      placeholder="Yazılan dərmanlar və müalicə planı..."
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-95 flex justify-center items-center gap-2">
                  <span>💾</span> Tibbi Qeydi Yaddaşa Ver →
                </button>
              </form>
            </div>

            {/* Visit History Timeline */}
            {patient.visits.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="font-black text-slate-900 text-lg">Keçmiş Ziyarətlər ({patient.visits.length})</h3>
                <div className="space-y-4">
                  {patient.visits.map(visit => (
                    <div key={visit.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-extrabold text-emerald-800 text-sm">{visit.visitDate.toLocaleDateString('az-AZ')}</span>
                        <div className="flex gap-3 text-xs font-bold text-slate-500">
                          {visit.temperature && <span className="bg-amber-50 px-2.5 py-1 rounded-lg text-amber-800">🌡️ {visit.temperature}°C</span>}
                          {visit.weight && <span className="bg-blue-50 px-2.5 py-1 rounded-lg text-blue-800">⚖️ {visit.weight} KQ</span>}
                        </div>
                      </div>
                      <div className="space-y-2 text-xs font-medium text-slate-600">
                        {visit.reason && <p><strong className="text-slate-800">Şikayət:</strong> {visit.reason}</p>}
                        {visit.doctorNotes && <p><strong className="text-slate-800">Diaqnoz:</strong> {visit.doctorNotes}</p>}
                        {visit.treatment && <p><strong className="text-slate-800">Müalicə:</strong> {visit.treatment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
