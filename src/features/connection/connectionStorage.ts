const STORAGE_KEY = 'shade.apiToken'

export function loadStoredToken(): string | null {
    const token = sessionStorage.getItem(STORAGE_KEY)

    if (!token) {
        return null
    }

    return token
}

export function saveStoredToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEY, token)
}

export function clearStoredToken(): void {
    sessionStorage.removeItem(STORAGE_KEY)
}