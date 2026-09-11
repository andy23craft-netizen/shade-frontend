export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

type SeasonalBoundary = {
    startsAt: string
    season: Season
}

/*
 * Northern Hemisphere astronomical equinoxes and solstices, in UTC. Keeping
 * this small table in the client makes the transition reproducible and avoids
 * a runtime dependency on a calendar service.
 */
export const seasonalBoundaries: readonly SeasonalBoundary[] = [
    { startsAt: '2026-03-20T14:46:00.000Z', season: 'spring' },
    { startsAt: '2026-06-21T08:25:00.000Z', season: 'summer' },
    { startsAt: '2026-09-23T00:05:00.000Z', season: 'autumn' },
    { startsAt: '2026-12-21T20:50:00.000Z', season: 'winter' },
    { startsAt: '2027-03-20T20:25:00.000Z', season: 'spring' },
    { startsAt: '2027-06-21T14:11:00.000Z', season: 'summer' },
    { startsAt: '2027-09-23T06:02:00.000Z', season: 'autumn' },
    { startsAt: '2027-12-22T02:42:00.000Z', season: 'winter' },
    { startsAt: '2028-03-20T02:17:00.000Z', season: 'spring' },
    { startsAt: '2028-06-20T20:02:00.000Z', season: 'summer' },
    { startsAt: '2028-09-22T11:45:00.000Z', season: 'autumn' },
    { startsAt: '2028-12-21T08:20:00.000Z', season: 'winter' },
    { startsAt: '2029-03-20T08:01:00.000Z', season: 'spring' },
    { startsAt: '2029-06-21T01:48:00.000Z', season: 'summer' },
    { startsAt: '2029-09-22T17:37:00.000Z', season: 'autumn' },
    { startsAt: '2029-12-21T14:14:00.000Z', season: 'winter' },
    { startsAt: '2030-03-20T13:51:00.000Z', season: 'spring' },
    { startsAt: '2030-06-21T07:31:00.000Z', season: 'summer' },
    { startsAt: '2030-09-22T23:27:00.000Z', season: 'autumn' },
    { startsAt: '2030-12-21T20:09:00.000Z', season: 'winter' },
] as const

export function seasonAt(date: Date): Season {
    let season: Season = 'winter'

    for (const boundary of seasonalBoundaries) {
        if (date.getTime() < Date.parse(boundary.startsAt)) {
            break
        }
        season = boundary.season
    }

    return season
}

export function nextSeasonBoundaryAfter(date: Date): Date | null {
    const next = seasonalBoundaries.find(
        (boundary) => Date.parse(boundary.startsAt) > date.getTime(),
    )

    return next === undefined ? null : new Date(next.startsAt)
}
