import { describe, expect, it } from 'vitest'

import {
    nextSeasonBoundaryAfter,
    seasonalBoundaries,
    seasonAt,
} from './season'

describe('seasonAt', () => {
    it('changes at every checked-in astronomical event timestamp', () => {
        for (const [index, boundary] of seasonalBoundaries.entries()) {
            const timestamp = Date.parse(boundary.startsAt)
            const previousSeason = index === 0
                ? 'winter'
                : seasonalBoundaries[index - 1].season
            expect(seasonAt(new Date(timestamp - 1))).toBe(previousSeason)
            expect(seasonAt(new Date(timestamp))).toBe(boundary.season)
        }
    })

    it('finds the next checked-in boundary', () => {
        expect(nextSeasonBoundaryAfter(new Date('2026-06-21T08:24:59.999Z'))?.toISOString())
            .toBe('2026-06-21T08:25:00.000Z')
    })
})
