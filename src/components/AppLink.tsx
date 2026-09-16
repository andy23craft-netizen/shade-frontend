import { forwardRef, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { useSiteReadOnly } from '../features/siteReadOnly/useSiteReadOnly'

type AppLinkVariant = 'primary' | 'secondary' | 'danger'

export interface AppLinkProps extends LinkProps {
  variant?: AppLinkVariant
  className?: string
  /** When true, block navigation while site-wide read-only is on. */
  mutating?: boolean
}

const READ_ONLY_TITLE = 'Site is in read-only mode'

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  (
    {
      className,
      variant,
      mutating = false,
      onClick,
      title,
      children,
      ...props
    },
    ref,
  ) => {
    const { writesDisabled } = useSiteReadOnly()
    const locked = mutating && writesDisabled
    const classes = [
      'app-link',
      variant ? `app-link--${variant}` : undefined,
      locked ? 'app-link--disabled' : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      if (locked) {
        event.preventDefault()
        return
      }
      onClick?.(event)
    }

    return (
      <Link
        ref={ref}
        className={classes}
        aria-disabled={locked || undefined}
        tabIndex={locked ? -1 : undefined}
        title={locked ? READ_ONLY_TITLE : title}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    )
  },
)

AppLink.displayName = 'AppLink'
