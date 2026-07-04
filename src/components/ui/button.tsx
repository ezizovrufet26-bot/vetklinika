'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glass'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-premium hover:brightness-110 active:brightness-95',
  secondary:
    'bg-secondary text-secondary-foreground border border-border hover:bg-muted',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-secondary hover:border-ring/40',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground shadow-soft hover:brightness-110',
  glass:
    'glass-panel text-foreground shadow-soft hover:shadow-premium',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
  icon: 'h-11 w-11 rounded-xl',
}

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
}

/** Micro-interaksiyalı premium düymə: tap zamanı yığılma, hover-da qalxma */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center font-bold tracking-tight select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export default Button
