import { describe, expect, it, vi } from 'vitest'

import { createQrGenerationQueue } from './qrGenerationQueue'

describe('createQrGenerationQueue', () => {
    it('runs no more than the configured number of QR generations at once', async () => {
        const queue = createQrGenerationQueue(2)
        let resolveFirst: ((value: string | null) => void) | undefined
        let resolveSecond: ((value: string | null) => void) | undefined
        const first = vi.fn(() => new Promise<string | null>((resolve) => {
            resolveFirst = resolve
        }))
        const second = vi.fn(() => new Promise<string | null>((resolve) => {
            resolveSecond = resolve
        }))
        const third = vi.fn().mockResolvedValue('third')

        const firstJob = queue.enqueue(first)
        const secondJob = queue.enqueue(second)
        const thirdJob = queue.enqueue(third)

        expect(first).toHaveBeenCalledOnce()
        expect(second).toHaveBeenCalledOnce()
        expect(third).not.toHaveBeenCalled()

        resolveFirst?.('first')
        await expect(firstJob.result).resolves.toBe('first')
        await vi.waitFor(() => expect(third).toHaveBeenCalledOnce())

        resolveSecond?.('second')
        await expect(secondJob.result).resolves.toBe('second')
        await expect(thirdJob.result).resolves.toBe('third')
    })
})
