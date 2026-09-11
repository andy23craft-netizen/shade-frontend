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
    const [season, setSeason] = useState(
        () => previewSeason ?? seasonAt(new Date()),
    )

    useEffect(() => {
        if (previewSeason !== null) {
            setSeason(previewSeason)
            return undefined
        }

        let timeout: number | undefined

        const scheduleUpdate = () => {
            const now = new Date()
            setSeason(seasonAt(now))
            const nextBoundary = nextSeasonBoundaryAfter(now)

            if (nextBoundary === null) {
                return
            }

            timeout = window.setTimeout(
                scheduleUpdate,
                Math.max(0, nextBoundary.getTime() - now.getTime()) + 1,
            )
        }

        scheduleUpdate()
        return () => {
            if (timeout !== undefined) {
                window.clearTimeout(timeout)
            }
        }
    }, [previewSeason])

    return season
}

export function SeasonalAtmosphere({
    home = false,
}: {
    home?: boolean
}) {
    return (
        <div
            className="seasonal-atmosphere"
            aria-hidden="true"
        >
            <span className="seasonal-atmosphere__wash" />
            <span className="seasonal-atmosphere__motif" />
            {home ? <span className="seasonal-atmosphere__home-accent" /> : null}
        </div>
    )
}
