export class ApiTokenError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ApiTokenError'
    }
}

export function readApiToken(): string {
    const raw = import.meta.env.VITE_API_SECRET_KEY

    if (typeof raw !== 'string' || raw.trim() === '') {
        throw new ApiTokenError(
            'Shade API token is missing. Copy .env.example to .env, set VITE_API_SECRET_KEY to match the backend API_SECRET_KEY, and restart the dev server or rebuild.',
        )
    }

    return raw.trim()
}
