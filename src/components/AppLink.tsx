import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'

type AppLinkVariant = 'primary' | 'secondary' | 'danger'

export interface AppLinkProps extends LinkProps {
  variant?: AppLinkVariant
  className?: string
}

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ className, variant, ...props }, ref) => {
    const classes = [
      'app-link',
      variant ? `app-link--${variant}` : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return <Link ref={ref} className={classes} {...props} />
  },
)

AppLink.displayName = 'AppLink'