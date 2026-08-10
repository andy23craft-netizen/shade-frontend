import type { ReactNode } from 'react'

export interface LoadingStateProps {
  label?: string
  children?: ReactNode
  className?: string
}

export function LoadingState({
  label = 'Loading…',
  children,
  className,
}: LoadingStateProps) {
  const classes = ['loading-state', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="status" aria-live="polite">
      <div className="loading-state__indicator" aria-hidden="true" />
      <div>{children ?? label}</div>
    </div>
  )
}