import type {
    BulkBookLookupItemResult,
} from '../../api/apiTypes'

export type BulkAddQueueStatus =
    | 'queued'
    | 'looking_up'
    | 'ready'
    | 'needs_review'
    | 'incomplete'
    | 'already_exists'
    | 'lookup_failed'

export type BulkAddQueueItem = {
    clientItemId: string
    isbn: string
    status: BulkAddQueueStatus
    lookupResult?: BulkBookLookupItemResult
    lookupError?: string
}

export function normalizeBulkAddIsbn(
    value: string,
): string {
    return value
        .trim()
        .replace(/[\s-]+/g, '')
        .toUpperCase()
}

export function classifyBulkLookupResult(
    result: BulkBookLookupItemResult,
): BulkAddQueueStatus {
    if (result.status !== 'found') {
        return 'incomplete'
    }

    if (
        result.catalog_state === 'owned' ||
        result.catalog_state === 'unshelved' ||
        result.catalog_state === 'ambiguous'
    ) {
        return 'already_exists'
    }

    if (result.draft === null || result.draft === undefined) {
        return 'incomplete'
    }

    if (
        result.catalog_state === 'wishlist' ||
        (result.missing_fields?.length ?? 0) > 0
    ) {
        return 'needs_review'
    }

    return 'ready'
}

export function bulkAddStatusLabel(
    status: BulkAddQueueStatus,
): string {
    switch (status) {
        case 'queued':
            return 'Queued'
        case 'looking_up':
            return 'Looking Up'
        case 'ready':
            return 'Ready'
        case 'needs_review':
        case 'lookup_failed':
            return 'Needs Review'
        case 'incomplete':
            return 'Incomplete'
        case 'already_exists':
            return 'Already Exists'
    }
}

export function bulkAddLookupDetail(
    item: BulkAddQueueItem,
): string | null {
    if (item.lookupError) {
        return item.lookupError
    }

    const result = item.lookupResult

    if (!result) {
        return null
    }

    if (result.status === 'invalid_isbn') {
        return 'The scanned value is not a valid ISBN.'
    }

    if (result.status === 'not_found') {
        return 'No metadata was found. Manual entry will be available during review.'
    }

    if (result.status === 'provider_timeout') {
        return 'The metadata provider timed out. This item can be reviewed or retried.'
    }

    if (result.status === 'provider_failure') {
        return 'The metadata provider failed. This item can be reviewed or retried.'
    }

    if (result.catalog_state === 'wishlist') {
        return 'This ISBN matches a wishlist book. Review it before saving the shelf.'
    }

    if (
        result.catalog_state === 'owned' ||
        result.catalog_state === 'unshelved'
    ) {
        return 'This ISBN already matches a book in the catalog.'
    }

    if (result.catalog_state === 'ambiguous') {
        return 'This ISBN matches more than one catalog book and must be resolved.'
    }

    if ((result.missing_fields?.length ?? 0) > 0) {
        return `Missing metadata: ${result.missing_fields?.join(', ')}`
    }

    return null
}
