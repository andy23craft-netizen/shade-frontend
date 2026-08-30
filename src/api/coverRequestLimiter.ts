const MAX_CONCURRENT_COVER_REQUESTS = 6

let activeRequests = 0

interface Waiter {
    resolve: (release: () => void) => void
    reject: (reason: DOMException) => void
    signal: AbortSignal | undefined
}

const waiters: Waiter[] = []

function releaseSlot(): void {
    activeRequests -= 1

    while (waiters.length > 0) {
        const waiter = waiters.shift()

        if (waiter === undefined) {
            return
        }

        if (waiter.signal?.aborted === true) {
            continue
        }

        activeRequests += 1
        waiter.resolve(releaseSlot)
        return
    }
}

function acquireSlot(
    signal: AbortSignal | undefined,
): Promise<() => void> {
    if (signal?.aborted === true) {
        return Promise.reject(
            new DOMException(
                'The operation was aborted.',
                'AbortError',
            ),
        )
    }

    if (
        activeRequests <
        MAX_CONCURRENT_COVER_REQUESTS
    ) {
        activeRequests += 1
        return Promise.resolve(releaseSlot)
    }

    return new Promise((resolve, reject) => {
        const waiter: Waiter = {
            resolve,
            reject,
            signal,
        }

        const abort = () => {
            const index = waiters.indexOf(waiter)

            if (index !== -1) {
                waiters.splice(index, 1)
            }

            reject(
                new DOMException(
                    'The operation was aborted.',
                    'AbortError',
                ),
            )
        }

        signal?.addEventListener(
            'abort',
            abort,
            { once: true },
        )

        waiter.resolve = (release) => {
            signal?.removeEventListener(
                'abort',
                abort,
            )
            resolve(release)
        }

        waiters.push(waiter)
    })
}

export async function withCoverRequestSlot<T>(
    signal: AbortSignal | undefined,
    operation: () => Promise<T>,
): Promise<T> {
    const release = await acquireSlot(signal)

    try {
        return await operation()
    } finally {
        release()
    }
}
