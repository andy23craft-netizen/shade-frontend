import { useEffect, useState } from 'react'

import {
    nextSeasonBoundaryAfter,
    seasonAt,
    type Season,
} from './season'

function previewSeasonFromUrl(): Season | null {
    if (!import.meta.env.DEV) {
        return null
    }

    const value = new URLSearchParams(window.location.search)
        .get('season_preview')

    return value === 'spring' ||
        value === 'summer' ||
        value === 'autumn' ||
        value === 'winter'
        ? value
        : null
}

export function useCurrentSeason(): Season {
    const previewSeason = previewSeasonFromUrl()
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        if (previewSeason !== null) {
            return undefined
        }

        const nextBoundary = nextSeasonBoundaryAfter(now)
        if (nextBoundary === null) {
            return undefined
        }

        const timeout = window.setTimeout(() => {
            setNow(new Date())
        }, Math.max(0, nextBoundary.getTime() - now.getTime()) + 1)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [now, previewSeason])

    return previewSeason ?? seasonAt(now)
}
