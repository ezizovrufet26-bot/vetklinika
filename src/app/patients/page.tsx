import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, User, Phone, Stethoscope, ClipboardList, Cpu } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const speciesEmoji = (species: string) =>
  species === 'Pişik' ? '🐱' : species === 'İt' ? '🐶' : '🐾'

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
    <AppShell>
      <PageHeader
        title="Xəstə Bazası &"
        highlight="Klinik Tarixçə (EMR)"
        subtitle="Klinikadakı bütün heyvanların tam tibbi qovluğu və S.O.A.P. tarixçəsi"
        actions={
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-premium hover:brightness-110 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Yeni Xəstə Qeydiyyatı
          </Link>
        }
      />

      {patients.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-soft">
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-bold text-muted-foreground">Hələ xəstə qeydiyyatı yoxdur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="w-14 h-14 rounded-2xl bg-primary-soft border border-primary/15 flex items-center justify-center text-3xl">
                    {speciesEmoji(patient.species)}
                  </span>
                  <Badge tone={patient.chipNumber ? 'info' : 'neutral'}>
                    <Cpu className="w-3 h-3" /> {patient.chipNumber || 'Çipsiz'}
                  </Badge>
                </div>

                <h3 className="text-xl font-display font-extrabold">{patient.name}</h3>
                <p className="text-xs font-bold text-primary mt-0.5">
                  {patient.species} {patient.breed ? `• ${patient.breed}` : ''}
                </p>
                <p className="text-xs text-muted-foreground font-semibold mt-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <strong className="text-foreground">{patient.owner.firstName}</strong>
                  <Phone className="w-3 h-3 ml-1" /> {patient.owner.phone}
                </p>

                {/* Son müayinə */}
                <div className="mt-4 bg-secondary/60 p-3.5 rounded-xl border border-border text-xs">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" /> Son Müayinə
                  </p>
                  {patient.visits.length > 0 ? (
                    <p className="text-muted-foreground font-medium italic mt-1">
                      "{patient.visits[0].reason}"
                    </p>
                  ) : (
                    <p className="text-muted-foreground/60 italic mt-1">Hələ müayinə qeydi yoxdur</p>
                  )}
                </div>
              </div>

              <Link
                href={`/patients/${patient.id}`}
                className="w-full py-3 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-extrabold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-4 h-4" /> Tam Tarixçə & S.O.A.P.
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
