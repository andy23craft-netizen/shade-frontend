import {
    Children,
    type ReactNode,
    useCallback,
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
    const count = items.length

    const trackRef =
        useRef<HTMLUListElement>(null)

    const resumeTimerRef =
        useRef<number | null>(null)

    const [atStart, setAtStart] = useState(true)
    const [atEnd, setAtEnd] = useState(count < 2)

    const [
        paused,
        setPaused,
    ] = useState(false)

    const updateBoundaries = useCallback(() => {
        const track = trackRef.current
        if (track === null) {
            return
        }
        const tolerance = 2
        setAtStart(track.scrollLeft <= tolerance)
        setAtEnd(
            track.scrollLeft + track.clientWidth >=
                track.scrollWidth - tolerance,
        )
    }, [])

    function move(direction: -1 | 1) {
        const track = trackRef.current
        if (track === null) return
        track.scrollBy({
            left: direction * Math.max(track.clientWidth * 0.8, 1),
            behavior: 'smooth',
        })
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

        const interval = window.setInterval(() => {
            const track = trackRef.current
            if (track === null) return
            if (atEnd) {
                track.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                move(1)
            }
        }, AUTO_ADVANCE_MS)

        return () => {
            window.clearInterval(interval)
        }
    }, [
        count,
        paused,
        atEnd,
    ])

    useEffect(() => {
        const track = trackRef.current
        if (track === null) return
        updateBoundaries()
        if (typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(updateBoundaries)
        observer.observe(track)
        return () => observer.disconnect()
    }, [count, updateBoundaries])

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
                    disabled={atStart}
                    onClick={() => {
                        pauseTemporarily()
                        move(-1)
                    }}
                >
                    ←
                </button>

                <button
                    type="button"
                    className="home-book-carousel__button"
                    aria-label={`Next ${ariaLabel}`}
                    disabled={atEnd}
                    onClick={() => {
                        pauseTemporarily()
                        move(1)
                    }}
                >
                    →
                </button>
            </div>

            <ul
                ref={trackRef}
                className="home-book-carousel__list"
                aria-label={ariaLabel}
                onScroll={updateBoundaries}
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
