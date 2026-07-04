'use client'

import { useEffect, useState } from 'react'
import { LogOut, Crown, Stethoscope, UserRound } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Yaradıcı / SuperAdmin',
  ADMIN: 'Klinika Rəhbəri',
  DOCTOR: 'Həkim',
  STAFF: 'Heyət',
}

export default function UserMenu() {
  const [me, setMe] = useState<{ name?: string; role?: string } | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then(res => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null))
  }, [])

  if (!me?.name) return null

  const isSuper = me.role === 'SUPERADMIN'

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <p className="text-xs font-extrabold truncate max-w-[140px]">{me.name}</p>
        <p className={`text-[10px] font-bold flex items-center justify-end gap-1 ${isSuper ? 'text-warning' : 'text-primary'}`}>
          {isSuper ? <Crown className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
          {ROLE_LABELS[me.role || ''] || me.role}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isSuper
          ? 'bg-warning/10 text-warning border border-warning/25'
          : 'bg-primary-soft text-primary border border-primary/15'
      }`}>
        <UserRound className="w-5 h-5" />
      </div>
      <form action={logout}>
        <button
          type="submit"
          title="Çıxış"
          className="h-10 w-10 rounded-xl border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 flex items-center justify-center shadow-soft transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
