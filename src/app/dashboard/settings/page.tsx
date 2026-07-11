import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getProfileData } from '@/app/actions/profile'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.sub) {
    redirect('/login')
  }

  const data = await getProfileData()

  return (
    <SettingsClient
      initialUser={data?.user ?? null}
      initialClinic={data?.clinic ?? null}
      role={session.role}
    />
  )
}
