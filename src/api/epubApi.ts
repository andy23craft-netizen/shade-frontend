import type { components } from './generated/openapi'
import type { createApiClient } from './apiClient'

type Schemas = components['schemas']
export type EpubAsset = Schemas['EpubAssetRead']
export type EpubLoan = Schemas['EpubLoanRead']
export type EpubInvitation = Schemas['EpubInvitationRead']
export type EpubProgress = Schemas['EpubProgressRead']
export type EpubProgressWrite = Schemas['EpubProgressWrite']
export type EpubLaunch = Schemas['EpubReaderLaunch']

export function createEpubApi(client: ReturnType<typeof createApiClient>) {
    const bookPath = (bookId: string) => `/epubs/books/${encodeURIComponent(bookId)}`
    const loanPath = (loanId: string) => `/epubs/loans/${encodeURIComponent(loanId)}`
    const profilePath = (bookId: string, profileId: string) => `${bookPath(bookId)}/reader?profile_id=${encodeURIComponent(profileId)}`
    return {
        getAsset: (bookId: string) => client.getJson<EpubAsset>(`${bookPath(bookId)}/asset`, { authenticated: true }),
        putAsset: (bookId: string, storageIdentifier: string) => client.requestJson<EpubAsset>(`${bookPath(bookId)}/asset`, { method: 'PUT', authenticated: true, body: { storage_identifier: storageIdentifier } }),
        createLoan: (bookId: string, borrower: string, borrowerEmail: string, notes?: string) => client.requestJson<EpubInvitation>(`${bookPath(bookId)}/loans`, { method: 'POST', authenticated: true, body: { borrower, borrower_email: borrowerEmail, notes: notes || null } }),
        getLoan: (loanId: string) => client.getJson<EpubLoan>(loanPath(loanId), { authenticated: true }),
        reissue: (loanId: string) => client.requestJson<EpubInvitation>(`${loanPath(loanId)}/reissue`, { method: 'POST', authenticated: true }),
        setLoanState: (loanId: string, state: 'returned' | 'completed' | 'revoked') => client.requestJson<EpubLoan>(`${loanPath(loanId)}/state`, { method: 'POST', authenticated: true, body: { state } }),
        launch: (bookId: string, profileId: string) => client.getJson<EpubLaunch>(profilePath(bookId, profileId), { authenticated: true }),
        adminContent: async (contentUrl: string) => {
            const url = new URL(contentUrl, window.location.origin)
            if (url.origin !== window.location.origin || !/^\/epubs\/books\/[^/]+\/content$/.test(url.pathname)) throw new Error('Reader content URL was rejected.')
            return (await client.get(url.pathname, { authenticated: true })).arrayBuffer()
        },
        saveAdminProgress: (bookId: string, profileId: string, progress: EpubProgressWrite) => client.requestJson<EpubProgress>(`${bookPath(bookId)}/reader/progress?profile_id=${encodeURIComponent(profileId)}`, { method: 'PUT', authenticated: true, body: progress }),
        complete: (bookId: string, profileId: string, rating: number | null, review: string | null) => client.requestJson(`${bookPath(bookId)}/reader/complete`, { method: 'POST', authenticated: true, body: { profile_id: profileId, rating, review } }),
        redeem: (invitation: string) => client.requestJson('/epub-reader/redeem', { method: 'POST', authenticated: false, credentials: 'include', body: { invitation } }),
        borrowerContent: async () => (await client.get('/epub-reader/content', { authenticated: false, credentials: 'include' })).arrayBuffer(),
        borrowerProgress: () => client.getJson<EpubProgress>('/epub-reader/progress', { authenticated: false, credentials: 'include' }),
        saveBorrowerProgress: (progress: EpubProgressWrite) => client.requestJson<EpubProgress>('/epub-reader/progress', { method: 'PUT', authenticated: false, credentials: 'include', body: progress }),
    }
}
