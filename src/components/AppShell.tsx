'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PawPrint, CalendarDays, MessageCircle, Receipt,
  Package, Microscope, BarChart3, Settings, Plus, Search, Menu, X, Stethoscope,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ui/theme-toggle'
import Button from '@/components/ui/button'
import UserMenu from '@/components/UserMenu'
import SuperAdminPanel from '@/components/SuperAdminPanel'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'İdarə Paneli', icon: LayoutDashboard },
  { href: '/patients', label: 'Xəstələr', icon: PawPrint },
  { href: '/calendar', label: 'Təqvim', icon: CalendarDays },
  { href: '/dashboard/communications', label: 'Çat / WhatsApp', icon: MessageCircle },
  { href: '/invoices', label: 'Qəbzlər', icon: Receipt },
  { href: '/inventory', label: 'Anbar / Aptek', icon: Package },
  { href: '/laboratory', label: 'Laboratoriya', icon: Microscope },
  { href: '/analytics', label: 'Analitika', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
]

// Yalnız SUPERADMIN görür — kataloq kurasiyası (/api/me ilə yoxlanır)
const SUPERADMIN_NAV_ITEM = { href: '/dashboard/partners', label: 'Tərəfdaşlar', icon: Building2 }

function SidebarContent({ pathname, isSuperAdmin, onNavigate }: { pathname: string; isSuperAdmin: boolean; onNavigate?: () => void }) {
  const navItems = isSuperAdmin ? [...NAV_ITEMS, SUPERADMIN_NAV_ITEM] : NAV_ITEMS
  return (
    <div className="flex flex-col h-full">
      {/* Brend */}
      <Link href="/" className="flex items-center gap-3 px-5 py-6" onClick={onNavigate}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-glow">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-display font-extrabold tracking-tight">
            Vet<span className="text-primary">Klinika</span>
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Clinical OS
          </span>
        </div>
      </Link>

      {/* Naviqasiya */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors group',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-primary-soft border border-primary/15"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Alt CTA */}
      <div className="p-4">
        <Link href="/patients/new" onClick={onNavigate}>
          <Button className="w-full" size="md">
            <Plus className="w-4 h-4" /> Yeni Qəbul
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function AppShell({
  children,
  headerActions,
}: {
  children: React.ReactNode
  headerActions?: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(res => (res.ok ? res.json() : null))
      .then(me => setIsSuperAdmin(me?.authenticated && me.role === 'SUPERADMIN'))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background bg-aurora">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-border glass-panel z-40">
        <SidebarContent pathname={pathname} isSuperAdmin={isSuperAdmin} />
      </aside>

      {/* Mobile slide-over */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Menyunu bağla"
                className="absolute top-5 right-4 p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent pathname={pathname} isSuperAdmin={isSuperAdmin} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Əsas sahə */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass-panel border-b border-border">
          <div className="flex items-center gap-4 px-4 sm:px-6 h-16">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menyunu aç"
              className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Qlobal axtarış */}
            <div className="flex-1 max-w-md hidden sm:flex items-center gap-3 bg-secondary/70 border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Pasiyent, çip nömrəsi və ya faktura axtar..."
                className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex-1 sm:hidden" />

            <div className="flex items-center gap-3">
              {headerActions}
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">{children}</main>
        <SuperAdminPanel />
      </div>
    </div>
  )
}
