import Link from 'next/link'
import { Stethoscope, PawPrint } from 'lucide-react'
import ThemeToggle from '@/components/ui/theme-toggle'
import JoinCta from './JoinCta'

/**
 * İctimai kataloq səhifələri üçün yüngül shell — server-rendered, AppShell YOX.
 * Dashboard vərdişləri (axtarış paneli, sessiya menyusu) bura daşınmır.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-40 glass-panel border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-glow">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xl font-display font-extrabold tracking-tight">
              Vet<span className="text-primary">Klinika</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-muted-foreground">
            <Link href="/klinikalar" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <PawPrint className="w-4 h-4" /> Klinikalar
            </Link>
            <Link href="/#features" className="hover:text-primary transition-colors">Sistem</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Giriş</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle className="h-10 w-10" />
            <JoinCta size="sm" label="Klinikanı Əlavə Et" />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} VetKlinika — Baytarlıq klinikaları üçün AI əməliyyat sistemi
          </p>
          <div className="flex items-center gap-5 text-sm font-bold text-muted-foreground">
            <Link href="/klinikalar" className="hover:text-primary transition-colors">Klinikalar</Link>
            <Link href="/" className="hover:text-primary transition-colors">Ana səhifə</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sistemə giriş</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
