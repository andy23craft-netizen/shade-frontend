import { cloneElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { useId } from 'react'

interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export interface FieldProps {
  label: string
  children: ReactElement<FieldControlProps>
  helpText?: ReactNode
  error?: ReactNode
  id?: string
  className?: string
}

export function Field({
  label,
  children,
  helpText,
  error,
  id,
  className,
}: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? `field-${generatedId}`

  const helpId = helpText ? `${controlId}-help` : undefined
  const errorId = error ? `${controlId}-error` : undefined

  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined

  const control = cloneElement(children, {
    id: children.props.id ?? controlId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
  })

  const classes = ['field', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="field__label" htmlFor={control.props.id}>
        {label}
      </label>

      {control}

      {helpText ? (
        <div id={helpId} className="field__help">
          {helpText}
        </div>
      ) : null}

      {error ? (
        <div id={errorId} className="field__error">
          {error}
        </div>
      ) : null}
    </div>
  )
}
