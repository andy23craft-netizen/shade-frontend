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
    createProtectedApi,
} from './protectedApi'

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
        dashboard:
            createDashboardApi(client),
        health: createHealthApi(client),
        protected:
            createProtectedApi(client),
        backup: createBackupApi(client),
    }
}
