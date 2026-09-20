// Browsers clamp a timeout above 2^31 - 1 milliseconds (about 24.8 days)
// and may run it immediately. Persistent sessions can be longer than that.
export const MAX_BROWSER_TIMEOUT_MS = 2_147_483_647

export function scheduleCredentialExpiry(
    expiresAt: number,
    onExpire: () => void,
): () => void {
    let timeout: number | null = null

    const schedule = () => {
        const remainingMs = expiresAt * 1000 - Date.now()
        if (remainingMs <= 0) {
            onExpire()
            return
        }
        timeout = window.setTimeout(
            schedule,
            Math.min(remainingMs, MAX_BROWSER_TIMEOUT_MS),
        )
    }

    schedule()

    return () => {
        if (timeout !== null) {
            window.clearTimeout(timeout)
        }
    }
}
