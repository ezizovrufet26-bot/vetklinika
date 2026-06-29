import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DiagnosticViewer from '@/components/DiagnosticViewer'
import LabResultsTable from '@/components/LabResultsTable'
import DeviceIntegrationSimulator from '@/components/DeviceIntegrationSimulator'

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
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      {/* Shepherd-Style Clean Pastel Geometric Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>
      <div className="absolute -top-20 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>

      <main className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Link href="/dashboard" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <h1 className="text-4xl font-black tracking-tight drop-shadow-sm text-slate-900">
                Mərkəzi <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">Laboratoriya & Diaqnostika</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-wide ml-14">Aparat İnteqrasiya İdarəetmə Mərkəzi (Mindray Vetus UZİ, Zoetis Vetscan, IDEXX DR30)</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl text-center shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">📸 DICOM İmicinq</p>
              <p className="text-2xl font-black text-slate-800">{images.length}</p>
            </div>
            <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl text-center shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">🩸 Qan & Biokimya</p>
              <p className="text-2xl font-black text-slate-800">{labResults.length}</p>
            </div>
          </div>
        </header>

        {/* Hardware Test Simulator */}
        <div className="mb-8">
          <DeviceIntegrationSimulator patientId={patients[0]?.id || ''} />
        </div>

        {/* Live Lab Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UZI & Rentgen Stream */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>📸</span> Rəqəmsal İmicinq Stream (UZİ & Rentgen)
            </h3>
            <DiagnosticViewer images={images as any} />
          </div>

          {/* Blood & Biochemistry Stream */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>🩸</span> Canlı Laboratoriya Axını (HL7 Analizlər)
            </h3>
            <LabResultsTable labResults={labResults as any} />
          </div>
        </div>
      </main>
    </div>
  )
}
