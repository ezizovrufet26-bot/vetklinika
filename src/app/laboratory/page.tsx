import { prisma } from '@/lib/prisma'
import { ScanLine, Droplets } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import DiagnosticViewer from '@/components/DiagnosticViewer'
import LabResultsTable from '@/components/LabResultsTable'
import DeviceIntegrationSimulator from '@/components/DeviceIntegrationSimulator'

export const dynamic = 'force-dynamic'

export default async function LaboratoryPage() {
  const [images, labResults, patients] = await Promise.all([
    prisma.diagnosticImage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: { include: { owner: true } } },
      take: 15
    }),
    prisma.labResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: { include: { owner: true } } },
      take: 15
    }),
    prisma.patient.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: { owner: true }
    })
  ])

  return (
    <AppShell>
      <PageHeader
        title="Mərkəzi"
        highlight="Laboratoriya & Diaqnostika"
        subtitle="Aparat inteqrasiya mərkəzi — Mindray Vetus UZİ, Zoetis Vetscan, IDEXX DR30"
        actions={
          <>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">DICOM İmicinq</p>
              <p className="text-xl font-display font-extrabold">{images.length}</p>
            </div>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Qan & Biokimya</p>
              <p className="text-xl font-display font-extrabold">{labResults.length}</p>
            </div>
          </>
        }
      />

      {/* Cihaz test simulyatoru */}
      <div className="mb-8">
        <DeviceIntegrationSimulator patientId={patients[0]?.id || ''} />
      </div>

      {/* Canlı lab axını */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-display font-extrabold flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <ScanLine className="w-4.5 h-4.5" />
            </span>
            Rəqəmsal İmicinq (UZİ & Rentgen)
          </h3>
          <DiagnosticViewer images={images as any} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-display font-extrabold flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Droplets className="w-4.5 h-4.5" />
            </span>
            Canlı Laboratoriya Axını (HL7)
          </h3>
          <LabResultsTable labResults={labResults as any} />
        </div>
      </div>
    </AppShell>
  )
}
