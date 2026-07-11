import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPartners } from '@/app/actions/partners'
import PartnersClient from './PartnersClient'

export const dynamic = 'force-dynamic'

export default async function PartnersPage() {
  const session = await getSession()
  if (!session?.sub) redirect('/login')
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  const result = await getPartners()
  const clinics = 'clinics' in result ? result.clinics : []

  return <PartnersClient initialClinics={clinics as any} />
}
