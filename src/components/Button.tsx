import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { useSiteReadOnly } from '../features/siteReadOnly/useSiteReadOnly'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** When true, disable this control while site-wide read-only is on. */
  mutating?: boolean
}

const READ_ONLY_TITLE = 'Site is in read-only mode'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      type = 'button',
      variant = 'primary',
      mutating = false,
      disabled,
      title,
      ...props
    },
    ref,
  ) => {
    const { writesDisabled } = useSiteReadOnly()
    const locked = mutating && writesDisabled
    const classes = ['button', `button--${variant}`, className]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        type={type}
        disabled={disabled || locked}
        title={locked ? READ_ONLY_TITLE : title}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
