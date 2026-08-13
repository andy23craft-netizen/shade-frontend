import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: EmptyStateProps) {
  const classes = ['empty-state', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes} aria-labelledby="empty-state-title">
      <h2 id="empty-state-title">{title}</h2>

      {children ? <div>{children}</div> : null}

      {action ? (
        <div className="empty-state__action">
          {action}
        </div>
      ) : null}
    </section>
  )
}
