import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PatientsListPage() {
  const patients = await prisma.patient.findMany({
    include: {
      owner: true,
      visits: { orderBy: { visitDate: 'desc' }, take: 1 },
      vaccines: { orderBy: { dateGiven: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans text-slate-800">
      {/* Shepherd-Style Clean Pastel Geometric Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>
      <div className="absolute -top-20 left-0 w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-3xl -z-10 opacity-70"></div>

      <main className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Link href="/dashboard" className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors border border-slate-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Xəstə Bazası & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Klinik Tarixçə (EMR)</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-wide ml-16">Klinikadakı bütün heyvanların tam tibbi qovluğu və S.O.A.P. tarixçəsi</p>
          </div>
          <div className="flex gap-4">
            <Link href="/patients/new" className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-full shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-sm transition-all hover:scale-[1.02]">
              <span>➕</span> Yeni Xəstə Qeydiyyatı
            </Link>
          </div>
        </header>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {patients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-sm">
                    {patient.species === 'Pişik' ? '🐱' : patient.species === 'İt' ? '🐶' : '🐾'}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-extrabold px-3 py-1 rounded-full border border-slate-200">
                    Çip: {patient.chipNumber || 'Yoxdur'}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900">{patient.name}</h3>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">{patient.species} {patient.breed ? `• ${patient.breed}` : ''}</p>
                <p className="text-xs text-slate-500 font-bold mt-3">
                  👤 Sahib: <strong className="text-slate-800">{patient.owner.firstName}</strong> (📞 {patient.owner.phone})
                </p>

                {/* Last Visit preview */}
                <div className="mt-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <p className="font-extrabold text-slate-700">🩺 Son Müayinə:</p>
                  {patient.visits.length > 0 ? (
                    <p className="text-slate-600 font-medium italic mt-1">"{patient.visits[0].reason}"</p>
                  ) : (
                    <p className="text-slate-400 italic mt-1">Hələ müayinə qeydi yoxdur</p>
                  )}
                </div>
              </div>

              <Link href={`/patients/${patient.id}`} className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl transition-all text-center flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                <span>📋</span> Tam Tarixçə & S.O.A.P.
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
