'use client'

import { motion, type Variants } from 'framer-motion'

/** Səhifə giriş animasiyaları — cinematic, amma yüngül */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
  }),
}

export function FadeUp({
  children,
  index = 0,
  className,
  once = true,
}: {
  children: React.ReactNode
  index?: number
  className?: string
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </motion.div>
  )
}
