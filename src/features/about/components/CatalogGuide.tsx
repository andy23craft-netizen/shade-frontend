import {
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import { AppLink } from '../../../components/AppLink'

function getFocusableElements(
    container: HTMLElement,
): HTMLElement[] {
    const candidates =
        container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        )

    return Array.from(candidates).filter(
        (element) =>
            element.getAttribute('aria-hidden') !==
            'true',
    )
}

export function CatalogGuide() {
    const [open, setOpen] = useState(false)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const openButtonRef = useRef<HTMLButtonElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        if (open && !dialog.open) {
            dialog.showModal()
            closeButtonRef.current?.focus()
            return
        }

        if (!open && dialog.open) {
            dialog.close()
            openButtonRef.current?.focus()
        }
    }, [open])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        const handleCancel = (event: Event) => {
            event.preventDefault()
            setOpen(false)
        }

        const handleClick = (event: MouseEvent) => {
            if (event.target === dialog) {
                setOpen(false)
            }
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (
                event.key !== 'Tab' ||
                !dialog.open
            ) {
                return
            }

            const focusable =
                getFocusableElements(dialog)

            if (focusable.length === 0) {
                return
            }

            const first = focusable[0]
            const last =
                focusable[focusable.length - 1]

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault()
                last.focus()
                return
            }

            if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault()
                first.focus()
            }
        }

        dialog.addEventListener(
            'cancel',
            handleCancel,
        )
        dialog.addEventListener(
            'click',
            handleClick,
        )
        dialog.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            dialog.removeEventListener(
                'cancel',
                handleCancel,
            )
            dialog.removeEventListener(
                'click',
                handleClick,
            )
            dialog.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [])

    return (
        <section
            className="catalog-guide"
            aria-labelledby="catalog-guide-heading"
        >
            <h2
                id="catalog-guide-heading"
                className="catalog-guide__section-heading"
            >
                How to Use the Library
            </h2>

            <button
                ref={openButtonRef}
                className="catalog-guide__drawer"
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-label="How to Use This Library"
            >
                <span className="catalog-guide__tab">
                    How to Use This Library
                </span>

                <span className="catalog-guide__drawer-front">
                    <span className="catalog-guide__label">
                        Reference
                    </span>
                </span>
            </button>

            <dialog
                ref={dialogRef}
                className="catalog-guide__dialog"
                aria-labelledby={titleId}
            >
                <div
                    className="catalog-guide__file-tab"
                    aria-hidden="true"
                >
                    Reference
                </div>

                <article className="catalog-guide__card">
                    <header className="catalog-guide__card-header">
                        <h2 id={titleId}>
                            How to Use This Library
                        </h2>
                    </header>

                    <div className="catalog-guide__instructions">
                        <p>
                            <AppLink to="/books">
                                Browse the collection
                            </AppLink>
                            {' '}and open a book to view its details
                            and available actions.
                        </p>

                        <p>
                            <AppLink to="/books/new">
                                Add a book
                            </AppLink>
                            {' '}manually, by ISBN, or with a
                            supported scanner.
                        </p>

                        <p>
                            Use{' '}
                            <AppLink to="/books">
                                Check Out
                            </AppLink>
                            {' '}to lend a book, and visit{' '}
                            <AppLink to="/loans">
                                Loans
                            </AppLink>
                            {' '}to check books in and review
                            active and past records.
                        </p>

                        <p>
                            <AppLink to="/shelves">
                                Manage shelves
                            </AppLink>
                            {' '}used to organize the collection,
                            and review collection statistics on the{' '}
                            <AppLink to="/dashboard">
                                Dashboard
                            </AppLink>
                            .
                        </p>

                        <p>
                            Under Administration, use{' '}
                            <AppLink to="/collection/manage">
                                Manage Collection
                            </AppLink>
                            {' '}to add books and organize shelves.
                        </p>

                        <p className="catalog-guide__signature">
                            The Librarian
                        </p>
                    </div>

                    <div
                        className="catalog-guide__hole"
                        aria-hidden="true"
                    />

                    <button
                        ref={closeButtonRef}
                        className="catalog-guide__return"
                        type="button"
                        onClick={() => setOpen(false)}
                    >
                        Return Card
                    </button>
                </article>
            </dialog>
        </section>
    )
}
