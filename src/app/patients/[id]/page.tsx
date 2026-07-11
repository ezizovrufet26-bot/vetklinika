import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { MapPin, Thermometer, Scale, User } from 'lucide-react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/badge'
import BodyMap from '@/components/BodyMap'
import AiVoiceAssistant from '@/components/AiVoiceAssistant'
import DiagnosticViewer from '@/components/DiagnosticViewer'
import LabResultsTable from '@/components/LabResultsTable'
import DeviceIntegrationSimulator from '@/components/DeviceIntegrationSimulator'
import VisitForm from './VisitForm'

export const dynamic = 'force-dynamic'

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
    <AppShell>
      {/* Pasiyent başlığı */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge tone="primary">{patient.species}</Badge>
            <Badge tone={patient.chipNumber ? 'info' : 'neutral'}>
              Çip: {patient.chipNumber || 'Yoxdur'}
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight flex items-center gap-2.5">
            {patient.species === 'Pişik' ? '🐱' : patient.species === 'İt' ? '🐶' : '🐾'} {patient.name}
          </h1>
        </div>

        <div className="bg-card px-5 py-3 rounded-xl border border-border shadow-soft text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider flex items-center gap-1.5 justify-end">
            <User className="w-3 h-3" /> Sahibi & Əlaqə
          </p>
          <p className="font-extrabold text-sm mt-0.5">
            {patient.owner.firstName}{' '}
            <span className="font-medium text-muted-foreground">({patient.owner.phone})</span>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Cihaz inteqrasiya simulyatoru */}
        <DeviceIntegrationSimulator patientId={patient.id} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol sütun: Bədən xəritəsi & Diaqnostika */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
              <h2 className="text-lg font-display font-extrabold mb-4 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </span>
                Anatomik Bədən Xəritəsi
              </h2>
              <BodyMap species={patient.species} />
            </div>

            <DiagnosticViewer images={patient.diagnosticImages as any} patientId={patient.id} />
            <AiVoiceAssistant />
          </div>

          {/* Sağ sütun: S.O.A.P. & Lab */}
          <div className="lg:col-span-7 space-y-6">
            <LabResultsTable labResults={patient.labResults as any} />

            {/* S.O.A.P. klinik forması */}
            <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <Badge tone="primary" className="mb-1.5">Klinik Müayinə</Badge>
                  <h2 className="text-xl font-display font-extrabold">S.O.A.P. Tibbi Qeyd Paneli</h2>
                </div>
                <div className="flex gap-2">
                  <span className="w-8 h-8 rounded-lg bg-warning/10 text-warning font-extrabold text-xs flex items-center justify-center">S</span>
                  <span className="w-8 h-8 rounded-lg bg-info/10 text-info font-extrabold text-xs flex items-center justify-center">O</span>
                  <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent font-extrabold text-xs flex items-center justify-center">A</span>
                  <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary font-extrabold text-xs flex items-center justify-center">P</span>
                </div>
              </div>

              <VisitForm patientId={patient.id} species={patient.species} patientName={patient.name} />
            </div>

            {/* Ziyarət tarixçəsi */}
            {patient.visits.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-extrabold text-lg">
                  Keçmiş Ziyarətlər ({patient.visits.length})
                </h3>
                <div className="space-y-4">
                  {patient.visits.map(visit => (
                    <div key={visit.id} className="bg-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-premium transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-extrabold text-primary text-sm">
                          {visit.visitDate.toLocaleDateString('az-AZ')}
                        </span>
                        <div className="flex gap-2 text-xs font-bold">
                          {visit.temperature && (
                            <span className="bg-warning/10 text-warning px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Thermometer className="w-3 h-3" /> {visit.temperature}°C
                            </span>
                          )}
                          {visit.weight && (
                            <span className="bg-info/10 text-info px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Scale className="w-3 h-3" /> {visit.weight} KQ
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-xs font-medium text-muted-foreground">
                        {visit.reason && <p><strong className="text-foreground">Şikayət:</strong> {visit.reason}</p>}
                        {visit.doctorNotes && <p><strong className="text-foreground">Diaqnoz:</strong> {visit.doctorNotes}</p>}
                        {visit.treatment && <p><strong className="text-foreground">Müalicə:</strong> {visit.treatment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
