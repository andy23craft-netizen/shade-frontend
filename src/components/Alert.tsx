import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

function alertRole(variant: AlertVariant): 'alert' | 'status' {
  if (variant === 'error') {
    return 'alert'
  }

  return 'status'
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  const classes = ['alert', `alert--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role={alertRole(variant)}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  )
}
