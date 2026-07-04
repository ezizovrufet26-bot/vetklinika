'use client'

import StatCard from '@/components/ui/stat-card'
import { Wallet, HeartPulse, CalendarCheck, Bot } from 'lucide-react'

export default function DashboardStats({
  totalRevenue,
  activePatients,
  approvedAppointments,
  pendingAiRequests,
  totalPatients,
}: {
  totalRevenue: number
  activePatients: number
  approvedAppointments: number
  pendingAiRequests: number
  totalPatients: number
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        index={0}
        label="Ümumi Gəlir"
        value={totalRevenue}
        suffix="₼"
        hint="Ödənilmiş fakturalardan"
        icon={<Wallet className="w-5 h-5" />}
        tone="primary"
        badge="Canlı"
      />
      <StatCard
        index={1}
        label="Aktiv Pasiyentlər"
        value={activePatients}
        suffix={`/ ${totalPatients}`}
        hint="Müayinə və stasionar zallarında"
        icon={<HeartPulse className="w-5 h-5" />}
        tone="info"
        badge="Klinikada"
      />
      <StatCard
        index={2}
        label="Təsdiqli Randevular"
        value={approvedAppointments}
        suffix="seans"
        hint="Qarşıdan gələn təyinatlar"
        icon={<CalendarCheck className="w-5 h-5" />}
        tone="success"
      />
      <StatCard
        index={3}
        label="AI WhatsApp Sorğuları"
        value={pendingAiRequests}
        suffix="müraciət"
        hint="Həkim təsdiqi gözləyir"
        icon={<Bot className="w-5 h-5" />}
        tone="warning"
        badge={pendingAiRequests > 0 ? 'Gözləmədə' : undefined}
      />
    </section>
  )
}
