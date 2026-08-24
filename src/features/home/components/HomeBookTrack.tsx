import {
    Children,
    type PointerEvent,
    type ReactNode,
    useState,
} from 'react'

interface HomeBookTrackProps {
    ariaLabel: string
    children: ReactNode
}

const SWIPE_THRESHOLD = 45

export function HomeBookTrack({
                                  ariaLabel,
                                  children,
                              }: HomeBookTrackProps) {
    const cards = Children.toArray(children)

    const [
        activeIndex,
        setActiveIndex,
    ] = useState(0)

    const [
        pointerStart,
        setPointerStart,
    ] = useState<number | null>(null)

    const count = cards.length

    function moveNext() {
        if (count < 2) {
            return
        }

        setActiveIndex(
            (current) =>
                (current + 1) % count,
        )
    }

    function movePrevious() {
        if (count < 2) {
            return
        }

        setActiveIndex(
            (current) =>
                (current - 1 + count) % count,
        )
    }

    function relativePosition(
        index: number,
    ): number {
        return (
            (index - activeIndex + count) %
            count
        )
    }

    function handlePointerDown(
        event: PointerEvent<HTMLDivElement>,
    ) {
        setPointerStart(event.clientX)
    }

    function handlePointerUp(
        event: PointerEvent<HTMLDivElement>,
    ) {
        if (pointerStart === null) {
            return
        }

        const distance =
            event.clientX - pointerStart

        setPointerStart(null)

        if (
            Math.abs(distance) <
            SWIPE_THRESHOLD
        ) {
            return
        }

        if (distance < 0) {
            moveNext()
        } else {
            movePrevious()
        }
    }

    return (
        <div
            className="home-book-deck"
            aria-label={ariaLabel}
        >
            <div
                className="home-book-deck__stack"
                onPointerDown={
                    handlePointerDown
                }
                onPointerUp={
                    handlePointerUp
                }
                onPointerCancel={() => {
                    setPointerStart(null)
                }}
            >
                {cards.map(
                    (card, index) => {
                        const position =
                            relativePosition(
                                index,
                            )

                        return (
                            <div
                                key={index}
                                className="home-book-deck__card"
                                data-position={
                                    position
                                }
                                aria-hidden={
                                    position > 2
                                }
                            >
                                {card}
                            </div>
                        )
                    },
                )}
            </div>

            {count > 1 ? (
                <div className="home-book-deck__controls">
                    <button
                        type="button"
                        className="home-book-deck__button"
                        aria-label={`Previous ${ariaLabel}`}
                        onClick={
                            movePrevious
                        }
                    >
                        ←
                    </button>

                    <p
                        className="home-book-deck__position"
                        aria-live="polite"
                    >
                        {activeIndex + 1} /{' '}
                        {count}
                    </p>

                    <button
                        type="button"
                        className="home-book-deck__button"
                        aria-label={`Next ${ariaLabel}`}
                        onClick={
                            moveNext
                        }
                    >
                        →
                    </button>
                </div>
            ) : null}
        </div>
    )
}
