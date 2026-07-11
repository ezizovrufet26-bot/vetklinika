import { prisma } from '@/lib/prisma'
import KanbanBoard from "@/components/KanbanBoard";
import PendingApprovalWidget from "@/components/PendingApprovalWidget";
import VoiceSimulatorModal from "@/components/VoiceSimulatorModal";
import { getPendingAiAppointments } from "@/app/actions/ai-receptionist";
import DoctorHeaderProfile from "@/components/DoctorHeaderProfile";
import AppShell from "@/components/AppShell";
import DashboardStats from "@/components/DashboardStats";
import { FadeUp } from "@/components/ui/motion";
import { Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [activePatients, pendingAiAppointments, paidInvoices, allPatients, approvedAppointments] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicStatus: { not: 'NONE' } },
      include: { owner: true },
      orderBy: { updatedAt: 'desc' },
    }),
    getPendingAiAppointments(),
    prisma.invoice.findMany({ where: { status: 'PAID' } }),
    prisma.patient.count(),
    prisma.appointment.findMany({ where: { status: 'APPROVED' } }),
  ])

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <AppShell
      headerActions={
        <div className="hidden md:flex items-center gap-3">
          <DoctorHeaderProfile />
        </div>
      }
    >
      {/* Başlıq + AI alətlər paneli */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">
            İdarə Paneli
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Klinikanızın canlı mənzərəsi — gəlir, pasiyent axını və AI müraciətləri bir yerdə
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PendingApprovalWidget initialAppointments={pendingAiAppointments as any} />
          <VoiceSimulatorModal />
        </div>
      </div>

      {/* Canlı metrikalar */}
      <DashboardStats
        totalRevenue={Math.round(totalRevenue)}
        activePatients={activePatients.length}
        approvedAppointments={approvedAppointments.length}
        pendingAiRequests={pendingAiAppointments.length}
        totalPatients={allPatients}
      />

      {/* Pasiyent axını (Live Board) */}
      <FadeUp className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-extrabold tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <Activity className="w-4.5 h-4.5" />
              </span>
              Pasiyent Axını — Canlı Lövhə
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mt-1.5">
              Gözləmə zalı, müayinə otaqları və stasionar şöbənin real-vaxt kartları. Kartları sürüşdürərək status dəyişin.
            </p>
          </div>
        </div>
        <KanbanBoard initialPatients={activePatients as any} />
      </FadeUp>
    </AppShell>
  );
}
