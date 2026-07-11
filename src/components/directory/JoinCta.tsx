'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/button'
import RegisterRequestModal from '@/components/RegisterRequestModal'

/** "Klinikanızı əlavə edin" düyməsi + qeydiyyat modalı — kataloqun klinika-sahibi hunisi. */
export default function JoinCta({
  label = 'Klinikanızı Pulsuz Əlavə Edin',
  size = 'md',
  variant = 'primary',
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'outline' | 'glass'
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {label}
      </Button>
      <RegisterRequestModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
