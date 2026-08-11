let currentToken: string | null = null

export function getCurrentToken(): string | null {
    return currentToken
}

export function setCurrentToken(token: string): void {
    currentToken = token
}

export function clearCurrentToken(): void {
    currentToken = null
}
