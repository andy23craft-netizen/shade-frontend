import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    useBookCover,
} from '../../../api/booksQueries'

import type {
    Status,
} from '../../../api/apiTypes'

export type BookCoverStatus =
    | Status
    | 'wishlist'

interface BookCoverProps {
    bookId: string
    title: string
    status: BookCoverStatus
    decorative?: boolean
    className?: string
    eager?: boolean
}

function statusStampLabel(
    status: BookCoverStatus,
): string {
    switch (status) {
        case 'available':
            return 'AVAILABLE'

        case 'on_loan':
            return 'ON LOAN'

        case 'missing':
            return 'MISSING'

        case 'display_only':
            return 'DISPLAY ONLY'

        case 'wishlist':
            return 'WISHLIST'

        default:
            return status
                .replaceAll('_', ' ')
                .toUpperCase()
    }
}

export function BookCover({
                              bookId,
                              title,
                              status,
                              decorative = false,
                              className,
                              eager = false,
                          }: BookCoverProps) {
    const containerRef =
        useRef<HTMLElement | null>(null)

    const [
        hasEnteredLoadRange,
        setHasEnteredLoadRange,
    ] = useState(false)

    const shouldLoad =
        eager || hasEnteredLoadRange

    useEffect(() => {
        if (eager) {
            return
        }

        const element =
            containerRef.current

        if (element === null) {
            return
        }

        if (
            typeof IntersectionObserver ===
            'undefined'
        ) {
            const timeoutId =
                window.setTimeout(() => {
                    setHasEnteredLoadRange(true)
                }, 0)

            return () => {
                window.clearTimeout(timeoutId)
            }
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    if (
                        entries.some(
                            (entry) =>
                                entry.isIntersecting,
                        )
                    ) {
                        setHasEnteredLoadRange(
                            true,
                        )
                        observer.disconnect()
                    }
                },
                {
                    rootMargin: '300px 0px',
                },
            )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [
        eager,
        bookId,
    ])

    const coverQuery =
        useBookCover(bookId, {
            enabled: shouldLoad,
        })

    const objectUrl = useMemo(() => {
        const blob = coverQuery.data

        if (blob === undefined) {
            return null
        }

        return URL.createObjectURL(blob)
    }, [
        coverQuery.data,
    ])

    useEffect(() => {
        if (objectUrl === null) {
            return
        }

        return () => {
            URL.revokeObjectURL(
                objectUrl,
            )
        }
    }, [
        objectUrl,
    ])

    const [
        failedObjectUrl,
        setFailedObjectUrl,
    ] = useState<string | null>(null)

    const showImage =
        objectUrl !== null &&
        failedObjectUrl !== objectUrl

    const coverAlt = decorative
        ? ''
        : `Cover of ${title}`

    const stampLabel =
        statusStampLabel(status)

    const classes = [
        'book-cover',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <figure
            ref={containerRef}
            className={classes}
        >
            <div className="book-cover__frame">
                {showImage ? (
                    <img
                        src={objectUrl}
                        alt={coverAlt}
                        className="book-cover__image"
                        onError={() => {
                            setFailedObjectUrl(objectUrl)
                        }}
                    />
                ) : (
                    <div
                        className="book-cover__placeholder"
                        role={
                            decorative
                                ? undefined
                                : 'img'
                        }
                        aria-label={
                            decorative
                                ? undefined
                                : `No cover available for ${title}`
                        }
                        aria-hidden={
                            decorative
                                ? true
                                : undefined
                        }
                    >
                        <span
                            className="book-cover__placeholder-mark"
                            aria-hidden="true"
                        >
                            SL
                        </span>
                    </div>
                )}

                <span
                    className="book-cover__stamp"
                    data-status={status}
                >
                    {stampLabel}
                </span>
            </div>
        </figure>
    )
}
