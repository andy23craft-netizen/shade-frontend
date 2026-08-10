import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )

  return Array.from(candidates).filter((element) => {
    return element.getAttribute('aria-hidden') !== 'true'
  })
}

export function ConfirmationDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCancelRef = useRef(onCancel)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null

      dialog.showModal()
      cancelButtonRef.current?.focus()
      return
    }

    if (!open && dialog.open) {
      dialog.close()

      const previousFocus = previousFocusRef.current
      previousFocusRef.current = null
      previousFocus?.focus()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    const restoreFocus = () => {
      const previousFocus = previousFocusRef.current
      previousFocusRef.current = null
      previousFocus?.focus()
    }

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onCancelRef.current()
    }

    const handleClose = () => {
      restoreFocus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog.open) {
        return
      }

      const focusable = getFocusableElements(dialog)

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="confirmation-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="confirmation-dialog__content">
        <h2 id={titleId}>{title}</h2>

        <div id={descriptionId}>{children}</div>

        <div className="confirmation-dialog__actions">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={confirmVariant}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
