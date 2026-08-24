import {
    Children,
    type ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react'

interface HomeBookCarouselProps {
    ariaLabel: string
    children: ReactNode
}

const AUTO_ADVANCE_MS = 4000
const INTERACTION_PAUSE_MS = 6000

export function HomeBookCarousel({
                                     ariaLabel,
                                     children,
                                 }: HomeBookCarouselProps) {
    const items = Children.toArray(children)

    const trackRef =
        useRef<HTMLUListElement>(null)

    const resumeTimerRef =
        useRef<number | null>(null)

    const [
        activeIndex,
        setActiveIndex,
    ] = useState(0)

    const [
        paused,
        setPaused,
    ] = useState(false)

    const count = items.length

    function scrollToIndex(
        nextIndex: number,
        behavior: ScrollBehavior = 'smooth',
    ) {
        const track = trackRef.current

        if (track === null || count === 0) {
            return
        }

        const normalizedIndex =
            (nextIndex + count) % count

        const item =
            track.children[
                normalizedIndex
                ] as HTMLElement | undefined

        if (item === undefined) {
            return
        }

        track.scrollTo({
            left: item.offsetLeft,
            behavior,
        })

        setActiveIndex(normalizedIndex)
    }

    function moveNext() {
        scrollToIndex(activeIndex + 1)
    }

    function movePrevious() {
        scrollToIndex(activeIndex - 1)
    }

    function pauseTemporarily() {
        setPaused(true)

        if (resumeTimerRef.current !== null) {
            window.clearTimeout(
                resumeTimerRef.current,
            )
        }

        resumeTimerRef.current =
            window.setTimeout(() => {
                setPaused(false)
                resumeTimerRef.current = null
            }, INTERACTION_PAUSE_MS)
    }

    useEffect(() => {
        const prefersReducedMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches

        if (
            paused ||
            count < 2 ||
            prefersReducedMotion
        ) {
            return
        }

        const interval =
            window.setInterval(() => {
                setActiveIndex(
                    (currentIndex) => {
                        const nextIndex =
                            (currentIndex + 1) %
                            count

                        const track =
                            trackRef.current

                        const item =
                            track?.children[
                                nextIndex
                                ] as
                                | HTMLElement
                                | undefined

                        if (
                            track !== null &&
                            track !== undefined &&
                            item !== undefined
                        ) {
                            track.scrollTo({
                                left:
                                item.offsetLeft,
                                behavior:
                                    'smooth',
                            })
                        }

                        return nextIndex
                    },
                )
            }, AUTO_ADVANCE_MS)

        return () => {
            window.clearInterval(interval)
        }
    }, [
        count,
        paused,
    ])

    useEffect(() => {
        return () => {
            if (
                resumeTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    resumeTimerRef.current,
                )
            }
        }
    }, [])

    return (
        <div className="home-book-carousel">
            <div className="home-book-carousel__controls">
                <button
                    type="button"
                    className="home-book-carousel__button"
                    aria-label={`Previous ${ariaLabel}`}
                    onClick={() => {
                        pauseTemporarily()
                        movePrevious()
                    }}
                >
                    ←
                </button>

                <p
                    className="home-book-carousel__position"
                    aria-live="polite"
                >
                    {activeIndex + 1} / {count}
                </p>

                <button
                    type="button"
                    className="home-book-carousel__button"
                    aria-label={`Next ${ariaLabel}`}
                    onClick={() => {
                        pauseTemporarily()
                        moveNext()
                    }}
                >
                    →
                </button>
            </div>

            <ul
                ref={trackRef}
                className="home-book-carousel__list"
                aria-label={ariaLabel}
                onPointerDown={
                    pauseTemporarily
                }
                onFocusCapture={() => {
                    setPaused(true)
                }}
                onBlurCapture={() => {
                    setPaused(false)
                }}
                onMouseEnter={() => {
                    setPaused(true)
                }}
                onMouseLeave={() => {
                    setPaused(false)
                }}
            >
                {items}
            </ul>
        </div>
    )
}
