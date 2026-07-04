import { cn } from '@/lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral'

const tones: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  destructive: 'bg-destructive/10 text-destructive border-destructive/25',
  info: 'bg-info/10 text-info border-info/25',
  neutral: 'bg-secondary text-muted-foreground border-border',
}

export default function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold uppercase tracking-wider',
        tones[tone],
        className
      )}
      {...props}
    />
  )
}
