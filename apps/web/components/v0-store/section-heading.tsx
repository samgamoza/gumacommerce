import type { ReactNode } from "react"

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
