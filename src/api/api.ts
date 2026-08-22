import {
    createApiClient,
} from './apiClient'

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
    createCategoriesApi,
} from './categoriesApi'

import {
    createVersionApi,
} from './versionApi'

import {
    createWishlistsApi,
} from './wishlistsApi'

import {
    createCollectionsApi,
} from './collectionsApi'

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
        categories: createCategoriesApi(client),
        dashboard:
            createDashboardApi(client),
        health: createHealthApi(client),
        version: createVersionApi(client),
        wishlists: createWishlistsApi(client),
        collections: createCollectionsApi(client),
    }
}
