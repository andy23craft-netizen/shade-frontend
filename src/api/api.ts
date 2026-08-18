import {
    createApiClient,
} from './apiClient'

import {
    createBackupApi,
} from './backupApi'

import {
    createBooksApi,
} from './booksApi'

import {
    createDashboardApi,
} from './dashboardApi'

import {
    createHealthApi,
} from './healthApi'

import {
    createLoansApi,
} from './loansApi'

import {
    createShelvesApi,
} from './shelvesApi'

import {
    createVersionApi,
} from './versionApi'

import {
    createWishlistsApi,
} from './wishlistsApi'

export function createApi(
    options: Parameters<
        typeof createApiClient
    >[0],
) {
    const client =
        createApiClient(options)

    return {
        client,
        books: createBooksApi(client),
        loans: createLoansApi(client),
        shelves: createShelvesApi(client),
        dashboard:
            createDashboardApi(client),
        health: createHealthApi(client),
        version: createVersionApi(client),
        backup: createBackupApi(client),
        wishlists: createWishlistsApi(client),
    }
}
