import Link from "next/link";
import { prisma } from '@/lib/prisma'
import KanbanBoard from "@/components/KanbanBoard";
import PendingApprovalWidget from "@/components/PendingApprovalWidget";
import VoiceSimulatorModal from "@/components/VoiceSimulatorModal";
import { getPendingAiAppointments } from "@/app/actions/ai-receptionist";
import DoctorHeaderProfile from "@/components/DoctorHeaderProfile";
import ClinicSwitcher from "@/components/ClinicSwitcher";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [activePatients, pendingAiAppointments, invoices, allPatients, appointments] = await Promise.all([
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
    getPendingAiAppointments(),
    prisma.invoice.findMany({
      where: { status: 'PAID' }
    }),
    prisma.patient.findMany(),
    prisma.appointment.findMany({
      where: { status: 'APPROVED' }
    })
  ])

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-sans text-slate-800 relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Bio-Luxe Background Organic Lighting */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-teal-50/60 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* Top Executive Header Bar (Bio-Luxe Luxury Navigation & Doctor Profile) */}
        <header className="bg-white/90 backdrop-blur-2xl border border-emerald-100/80 rounded-[2.5rem] p-4 sm:p-6 shadow-xl shadow-emerald-900/5 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          
          {/* Brand & Global Search */}
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-700/20">
                🐾
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900">Vet<span className="text-emerald-600">Klinika</span></span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-700">Bio-Luxe Clinical OS</span>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 w-72 lg:w-96 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="text-slate-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Pasiyent, həkim, çip və ya faktura axtar..." 
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Center Action Dock */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center">
            <PendingApprovalWidget initialAppointments={pendingAiAppointments as any} />
            <VoiceSimulatorModal />

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden xl:block"></div>

            <Link href="/dashboard/communications" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>💬</span> Çat
            </Link>
            <Link href="/patients" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>🐾</span> Xəstələr
            </Link>
            <Link href="/calendar" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>📅</span> Təqvim
            </Link>
            <Link href="/invoices" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>🧾</span> Qəbzlər
            </Link>
            <Link href="/inventory" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>📦</span> Anbar
            </Link>
            <Link href="/laboratory" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>🔬</span> Lab
            </Link>
            <Link href="/analytics" className="px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold rounded-2xl border border-slate-200/60 transition-all flex items-center gap-2 text-xs">
              <span>📊</span> Analitika
            </Link>
            <Link href="/dashboard/settings" className="px-3.5 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-extrabold rounded-2xl border border-emerald-200/80 transition-all flex items-center gap-2 text-xs">
              <span>⚙️</span> Ayarlar & QR
            </Link>
            <Link href="/patients/new" className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 text-xs">
              <span>➕</span> Yeni Qəbul
            </Link>
          </div>

          {/* Right Doctor Profile & Status */}
          <div className="flex flex-wrap items-center gap-3">
            <ClinicSwitcher />
            <DoctorHeaderProfile />
          </div>
        </header>

        {/* Executive Metrics Overview Grid (Rich Stat Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Today's Revenue Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-emerald-100/80 shadow-lg shadow-emerald-900/5 hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform -z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">Ümumi Gəlir</span>
                <span className="text-emerald-600 font-black text-xs bg-emerald-100/60 px-2.5 py-0.5 rounded-lg">+15% 📈</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{totalRevenue.toFixed(0)} <span className="text-lg font-bold text-emerald-600">₼</span></h2>
              <p className="text-xs font-semibold text-slate-400 mt-2">Bu ay rəsmi ödənilmiş fakturalardan</p>
            </div>
          </div>

          {/* Active Patients Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-blue-100/80 shadow-lg shadow-blue-900/5 hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform -z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200/60">Aktiv Klinika</span>
                <span className="text-blue-600 font-black text-xs bg-blue-100/60 px-2.5 py-0.5 rounded-lg">Canlı 🩺</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activePatients.length} <span className="text-sm font-bold text-slate-400">pasiyent</span></h2>
              <p className="text-xs font-semibold text-slate-400 mt-2">Müayinə və stasionar zallarında</p>
            </div>
          </div>

          {/* Approved Appointments Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-purple-100/80 shadow-lg shadow-purple-900/5 hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform -z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/60">Növbəti Randevular</span>
                <span className="text-purple-600 font-black text-xs bg-purple-100/60 px-2.5 py-0.5 rounded-lg">Təsdiqli 📅</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{appointments.length} <span className="text-sm font-bold text-slate-400">seans</span></h2>
              <p className="text-xs font-semibold text-slate-400 mt-2">Bu gün üçün təyin edilmiş vaxtlar</p>
            </div>
          </div>

          {/* AI WhatsApp Requests Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-amber-100/80 shadow-lg shadow-amber-900/5 hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform -z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">AI WhatsApp Sorğu</span>
                <span className="text-amber-600 font-black text-xs bg-amber-100/60 px-2.5 py-0.5 rounded-lg">Gözləmədə 🤖</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{pendingAiAppointments.length} <span className="text-sm font-bold text-slate-400">müraciət</span></h2>
              <p className="text-xs font-semibold text-slate-400 mt-2">Həkim təsdiqi gözləyən müraciətlər</p>
            </div>
          </div>

        </section>

        {/* Main Clinical Board Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>🏥</span> Pasiyent Axını & Klinika Statusları (Live Board)
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">Gözləmə zalı, müayinə otaqları və stasionar şöbəsinin canlı kartları</p>
          </div>
        </div>

        {/* Rich Structured Kanban Board */}
        <div className="mt-2 relative z-10">
          <KanbanBoard initialPatients={activePatients as any} />
        </div>

      </main>
    </div>
  );
}
