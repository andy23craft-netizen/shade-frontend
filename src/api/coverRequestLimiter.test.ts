import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    withCoverRequestSlot,
} from './coverRequestLimiter'

describe('withCoverRequestSlot', () => {
    it('limits cover work to six concurrent operations', async () => {
        let releaseGate = () => {}
        const gate = new Promise<void>((resolve) => {
            releaseGate = resolve
        })
        let active = 0
        let peak = 0

        const operations = Array.from(
            { length: 12 },
            () =>
                withCoverRequestSlot(
                    undefined,
                    async () => {
                        active += 1
                        peak = Math.max(
                            peak,
                            active,
                        )
                        await gate
                        active -= 1
                    },
                ),
        )

        await Promise.resolve()

        expect(active).toBe(6)
        expect(peak).toBe(6)

        releaseGate()
        await Promise.all(operations)

        expect(active).toBe(0)
    })

    it('cancels work while it is waiting for a slot', async () => {
        let releaseGate = () => {}
        const gate = new Promise<void>((resolve) => {
            releaseGate = resolve
        })

        const activeOperations = Array.from(
            { length: 6 },
            () =>
                withCoverRequestSlot(
                    undefined,
                    () => gate,
                ),
        )

        await Promise.resolve()

        const controller = new AbortController()
        const queuedWork = vi.fn(
            async () => {},
        )
        const queuedOperation =
            withCoverRequestSlot(
                controller.signal,
                queuedWork,
            )

        controller.abort()

        await expect(
            queuedOperation,
        ).rejects.toMatchObject({
            name: 'AbortError',
        })

        expect(
            queuedWork,
        ).not.toHaveBeenCalled()

        releaseGate()
        await Promise.all(activeOperations)
    })

    it('releases a slot after active work fails', async () => {
        let rejectActive!: (
            reason: Error,
        ) => void
        const failedWork = new Promise<void>(
            (_resolve, reject) => {
                rejectActive = reject
            },
        )
        let releaseGate = () => {}
        const gate = new Promise<void>((resolve) => {
            releaseGate = resolve
        })

        const failedOperation =
            withCoverRequestSlot(
                undefined,
                () => failedWork,
            )
        const otherActiveOperations =
            Array.from(
                { length: 5 },
                () =>
                    withCoverRequestSlot(
                        undefined,
                        () => gate,
                    ),
            )
        const queuedWork = vi.fn(
            async () => {},
        )
        const queuedOperation =
            withCoverRequestSlot(
                undefined,
                queuedWork,
            )

        await Promise.resolve()

        expect(
            queuedWork,
        ).not.toHaveBeenCalled()

        const failure = new Error(
            'Cover request failed',
        )
        rejectActive(failure)

        await expect(
            failedOperation,
        ).rejects.toBe(failure)
        await queuedOperation

        expect(
            queuedWork,
        ).toHaveBeenCalledOnce()

        releaseGate()
        await Promise.all(
            otherActiveOperations,
        )
    })

    it('hands off an active cancellation slot to queued work', async () => {
        const controller = new AbortController()
        const activeWork = vi.fn(
            () =>
                new Promise<void>(
                    (_resolve, reject) => {
                        controller.signal
                            .addEventListener(
                                'abort',
                                () => {
                                    reject(
                                        new DOMException(
                                            'The operation was aborted.',
                                            'AbortError',
                                        ),
                                    )
                                },
                                { once: true },
                            )
                    },
                ),
        )
        const activeOperation =
            withCoverRequestSlot(
                controller.signal,
                activeWork,
            )
        let releaseGate = () => {}
        const gate = new Promise<void>((resolve) => {
            releaseGate = resolve
        })
        const otherActiveOperations =
            Array.from(
                { length: 5 },
                () =>
                    withCoverRequestSlot(
                        undefined,
                        () => gate,
                    ),
            )
        const queuedWork = vi.fn(
            async () => {},
        )
        const queuedOperation =
            withCoverRequestSlot(
                undefined,
                queuedWork,
            )

        await Promise.resolve()
        controller.abort()

        await expect(
            activeOperation,
        ).rejects.toMatchObject({
            name: 'AbortError',
        })
        await queuedOperation

        expect(
            activeWork,
        ).toHaveBeenCalledOnce()
        expect(
            queuedWork,
        ).toHaveBeenCalledOnce()

        releaseGate()
        await Promise.all(
            otherActiveOperations,
        )
    })
})
