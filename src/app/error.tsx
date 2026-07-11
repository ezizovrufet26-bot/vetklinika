'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/button'

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Səhifə xətası:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-extrabold text-foreground">
            Nəsə səhv getdi
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Sistem müvəqqəti əlçatan deyil — çox güman verilənlər bazası ilə bağlantıda
            fasilə var. Bir neçə saniyədən sonra yenidən cəhd edin.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()} size="md">
            <RefreshCw className="w-4 h-4" /> Yenidən cəhd et
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="md">
              <Home className="w-4 h-4" /> Ana səhifə
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
