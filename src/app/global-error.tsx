'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Kök səviyyəli xəta:', error)
  }, [error])

  return (
    <html lang="az">
      <body style={{ background: '#0a1214', color: '#e8f5f2', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sistem işə düşmədi</h1>
            <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 20 }}>
              Gözlənilməyən xəta baş verdi. Səhifəni yeniləməyi sınayın.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: '#047857', color: 'white', border: 'none',
                borderRadius: 12, padding: '10px 20px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Yenidən cəhd et
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
