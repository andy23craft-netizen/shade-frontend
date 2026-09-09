import type { CategoryRead, ShelfRead } from '../../api/apiTypes'

function normalizedToken(value: string): string {
    return value.normalize('NFC').toLocaleLowerCase()
}

function resolveToken<T>(token: string, entries: readonly T[], getToken: (entry: T) => string): T | undefined {
    const normalized = normalizedToken(token)
    const matches = entries.filter((entry) => normalizedToken(getToken(entry)) === normalized)
    return matches.length === 1 ? matches[0] : undefined
}

export function categoryBrowsePath(slug: string): string {
    return `/books/category/${encodeURIComponent(slug)}`
}

export function shelfBrowsePath(commonName: string): string {
    return `/books/shelf/${encodeURIComponent(commonName)}`
}

export function resolveCategoryBrowseToken(token: string, categories: readonly CategoryRead[]): CategoryRead | undefined {
    return resolveToken(token, categories, (category) => category.slug)
}

export function resolveShelfBrowseToken(token: string, shelves: readonly ShelfRead[]): ShelfRead | undefined {
    return resolveToken(token, shelves, (shelf) => shelf.common_name)
}
