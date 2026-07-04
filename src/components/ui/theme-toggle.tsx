'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
      className={cn(
        'relative h-11 w-11 rounded-xl border border-border bg-card text-foreground',
        'flex items-center justify-center shadow-soft hover:shadow-premium transition-shadow cursor-pointer',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
