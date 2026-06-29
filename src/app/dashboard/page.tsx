import Link from "next/link";
import { prisma } from '@/lib/prisma'
import KanbanBoard from "@/components/KanbanBoard";
import PendingApprovalWidget from "@/components/PendingApprovalWidget";
import VoiceSimulatorModal from "@/components/VoiceSimulatorModal";
import { getPendingAiAppointments } from "@/app/actions/ai-receptionist";

export default async function Home() {
  const [activePatients, pendingAiAppointments] = await Promise.all([
    prisma.patient.findMany({
      where: {
        clinicStatus: {
          not: 'NONE'
        }
      },
      include: {
        owner: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }),
    getPendingAiAppointments()
  ])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      {/* Shepherd-Style Clean Pastel Geometric Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>
      <div className="absolute -top-20 left-0 w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>
      
      <main className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-slate-900">
              Klinika <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">İdarəetmə Mərkəzi</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span>
              <p className="text-slate-500 text-sm sm:text-base font-bold tracking-wide">
                Bu gün <strong className="text-slate-800">{activePatients.length}</strong> pasiyent aktiv klinik müayinədədir.
              </p>
            </div>
          </div>
          
          {/* Floating Dock Navigation (Shepherd Light Mode Style) */}
          <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-2 rounded-[2.2rem] shadow-xl flex flex-wrap items-center gap-2">
            <PendingApprovalWidget initialAppointments={pendingAiAppointments as any} />
            <VoiceSimulatorModal />
            
            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            <Link href="/dashboard/communications" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">💬</span> Çat
            </Link>
            <Link href="/patients" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">🐾</span> Xəstələr
            </Link>
            <Link href="/calendar" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">📅</span> Təqvim
            </Link>
            <Link href="/invoices" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">🧾</span> Qəbizlər
            </Link>
            <Link href="/inventory" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">📦</span> Anbar
            </Link>
            <Link href="/laboratory" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">🔬</span> Lab
            </Link>
            <Link href="/analytics" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">📊</span> Analitika
            </Link>
            <Link href="/patients/new" className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">➕</span> Qəbul
            </Link>
            <Link href="/dashboard/settings" className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs">
              <span className="text-base">⚙️</span> Ayarlar
            </Link>
          </div>
        </header>

        {/* Kanban Board Area */}
        <div className="mt-6 relative z-10">          <KanbanBoard initialPatients={activePatients as any} />
        </div>

      </main>
    </div>
  );
}
