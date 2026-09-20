import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    MAX_BROWSER_TIMEOUT_MS,
    scheduleCredentialExpiry,
} from './authExpiry'

describe('scheduleCredentialExpiry', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('does not immediately expire a 30-day credential', () => {
        vi.useFakeTimers()
        const startedAt = Date.UTC(2026, 8, 20)
        vi.setSystemTime(startedAt)
        const expire = vi.fn()
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

        scheduleCredentialExpiry(
            Math.floor((startedAt + thirtyDaysMs) / 1000),
            expire,
        )

        vi.advanceTimersByTime(MAX_BROWSER_TIMEOUT_MS)
        expect(expire).not.toHaveBeenCalled()

        vi.advanceTimersByTime(thirtyDaysMs - MAX_BROWSER_TIMEOUT_MS)
        expect(expire).toHaveBeenCalledOnce()
    })
})
