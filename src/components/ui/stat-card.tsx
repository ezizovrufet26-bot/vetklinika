'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Badge from '@/components/ui/badge'

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral'

const iconTones: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  neutral: 'bg-secondary text-muted-foreground',
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, v => Math.round(v).toLocaleString('az-AZ'))

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: 'easeOut' })
    return controls.stop
  }, [value, mv])

  return <motion.span>{rounded}</motion.span>
}

export default function StatCard({
  label,
  value,
  suffix,
  hint,
  icon,
  tone = 'primary',
  badge,
  index = 0,
}: {
  label: string
  value: number
  suffix?: string
  hint?: string
  icon: ReactNode
  tone?: Tone
  badge?: string
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -3 }}
      className={cn(
        'relative overflow-hidden bg-card rounded-2xl border border-border p-6',
        'shadow-soft hover:shadow-premium transition-shadow duration-300 group'
      )}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-secondary/60 group-hover:scale-125 transition-transform duration-500" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconTones[tone])}>
          {icon}
        </div>
        {badge && <Badge tone={tone}>{badge}</Badge>}
      </div>

      <div className="relative z-10">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <h2 className="text-3xl font-display font-extrabold tracking-tight">
          <AnimatedNumber value={value} />
          {suffix && <span className="text-lg font-bold text-muted-foreground ml-1.5">{suffix}</span>}
        </h2>
        {hint && <p className="text-xs font-medium text-muted-foreground mt-2">{hint}</p>}
      </div>
    </motion.div>
  )
}
