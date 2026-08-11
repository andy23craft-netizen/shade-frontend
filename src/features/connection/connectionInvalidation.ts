/* connectionInvalidation.ts */

type ConnectionInvalidationListener = () => void

const listeners = new Set<ConnectionInvalidationListener>()

export function subscribeToConnectionInvalidation(
    listener: ConnectionInvalidationListener,
): () => void {
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
    }
}

export function notifyConnectionInvalidated(): void {
    for (const listener of listeners) {
        listener()
    }
}
