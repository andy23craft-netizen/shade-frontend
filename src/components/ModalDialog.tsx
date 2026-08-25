import {
    useEffect,
    useId,
    useRef,
    type ReactNode,
} from 'react'

interface ModalDialogProps {
    open: boolean
    title: string
    children: ReactNode
    onClose: () => void
}

export function ModalDialog({
                                open,
                                title,
                                children,
                                onClose,
                            }: ModalDialogProps) {
    const dialogRef =
        useRef<HTMLDialogElement>(null)

    const previousFocusRef =
        useRef<HTMLElement | null>(null)

    const onCloseRef =
        useRef(onClose)

    const titleId = useId()

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        if (
            open &&
            !dialog.open
        ) {
            previousFocusRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null

            dialog.showModal()
            return
        }

        if (
            !open &&
            dialog.open
        ) {
            dialog.close()

            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }
    }, [open])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        function handleCancel(
            event: Event,
        ) {
            event.preventDefault()
            onCloseRef.current()
        }

        function handleClose() {
            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }

        dialog.addEventListener(
            'cancel',
            handleCancel,
        )

        dialog.addEventListener(
            'close',
            handleClose,
        )

        return () => {
            dialog.removeEventListener(
                'cancel',
                handleCancel,
            )

            dialog.removeEventListener(
                'close',
                handleClose,
            )
        }
    }, [])

    return (
        <dialog
            ref={dialogRef}
            className="confirmation-dialog modal-dialog"
            aria-labelledby={titleId}
        >
            <div className="confirmation-dialog__content modal-dialog__content">
                <div className="modal-dialog__heading">
                    <h2 id={titleId}>
                        {title}
                    </h2>

                    <button
                        type="button"
                        className="modal-dialog__close"
                        aria-label={`Close ${title}`}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {children}
            </div>
        </dialog>
    )
}
