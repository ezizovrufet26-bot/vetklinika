import { cn } from '@/lib/utils'

/** Bütün daxili səhifələr üçün vahid başlıq bloku */
export default function PageHeader({
  title,
  highlight,
  subtitle,
  actions,
  className,
}: {
  title: string
  highlight?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8',
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">
          {title} {highlight && <span className="text-gradient">{highlight}</span>}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground font-medium mt-1.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}
