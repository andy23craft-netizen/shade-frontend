import type { components } from './generated/openapi'
import type { createApiClient } from './apiClient'

type Schemas = components['schemas']
export type PdfListing = Schemas['PdfDirectoryListing']
export type PdfEntry = Schemas['PdfLibraryEntry']

export function createPdfLibraryApi(client: ReturnType<typeof createApiClient>) {
    return {
        list: (path?: string) => client.getJson<PdfListing>(`/pdf-library${path ? `?path=${encodeURIComponent(path)}` : ''}`, { authenticated: true }),
        handoff: async (identifier: string, download: boolean) => {
            const suffix = download ? '&download=true' : ''
            const response = await client.requestJson<Schemas['PdfViewerHandoff']>(`/pdf-library/viewer-handoff?identifier=${encodeURIComponent(identifier)}${suffix}`, { method: 'POST', authenticated: true, credentials: 'include' })
            const url = new URL(response.viewer_url, window.location.origin)
            if (url.origin !== window.location.origin || url.pathname !== '/pdf-library/file' || url.search || url.hash) throw new Error('PDF viewer URL was rejected.')
            return url.href
        },
    }
}
