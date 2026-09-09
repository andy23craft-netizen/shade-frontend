import { useEffect, useState } from 'react'

import { Button } from './Button'

interface BackToTopProps {
    enabled?: boolean
    focusSelector?: string
}

export function BackToTop({
    enabled = true,
    focusSelector = 'h1',
}: BackToTopProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const updateVisibility = () => {
            setVisible(enabled && window.scrollY > 640)
        }

        window.addEventListener('scroll', updateVisibility, {
            passive: true,
        })
        updateVisibility()

        return () => {
            window.removeEventListener('scroll', updateVisibility)
        }
    }, [enabled])

    if (!visible) {
        return null
    }

    return (
        <Button
            type="button"
            className="back-to-top"
            onClick={() => {
                const reduceMotion = window.matchMedia(
                    '(prefers-reduced-motion: reduce)',
                ).matches

                window.scrollTo({
                    top: 0,
                    behavior: reduceMotion ? 'auto' : 'smooth',
                })

                window.requestAnimationFrame(() => {
                    document
                        .querySelector<HTMLElement>(focusSelector)
                        ?.focus({ preventScroll: true })
                })
            }}
        >
            Back to top
        </Button>
    )
}
