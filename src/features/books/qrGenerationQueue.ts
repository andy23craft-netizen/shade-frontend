export interface QrGenerationQueue {
    enqueue<T>(generate: () => Promise<T | null>): {
        cancel: () => void
        result: Promise<T | null>
    }
}

interface QueuedGeneration<T> {
    cancelled: boolean
    generate: () => Promise<T | null>
    resolve: (value: T | null) => void
}

export function createQrGenerationQueue(
    maximumConcurrent: number,
): QrGenerationQueue {
    let active = 0
    const queued: QueuedGeneration<unknown>[] = []

    function runNext(): void {
        while (active < maximumConcurrent && queued.length > 0) {
            const job = queued.shift()
            if (!job) return

            if (job.cancelled) {
                job.resolve(null)
                continue
            }

            active += 1
            void job.generate()
                .then((value) => job.resolve(job.cancelled ? null : value))
                .catch(() => job.resolve(null))
                .finally(() => {
                    active -= 1
                    runNext()
                })
        }
    }

    return {
        enqueue<T>(generate: () => Promise<T | null>) {
            let job!: QueuedGeneration<T>
            const result = new Promise<T | null>((resolve) => {
                job = { cancelled: false, generate, resolve }
            })

            queued.push(job as QueuedGeneration<unknown>)
            runNext()

            return {
                result,
                cancel: () => { job.cancelled = true },
            }
        },
    }
}

export const bookLabelGenerationQueue = createQrGenerationQueue(3)
