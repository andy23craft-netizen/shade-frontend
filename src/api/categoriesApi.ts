import type {
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickCategoryCreate,
    pickCategoryUpdate,
} from './requestFields'

export type ListCategoriesOptions = ApiCallOptions & {
    inUse?: boolean
}

function withSignal(
    signal: AbortSignal | undefined,
): ApiCallOptions | undefined {
    return signal === undefined
        ? undefined
        : {
            signal,
        }
}

export function createCategoriesApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListCategoriesOptions = {},
        ): Promise<CategoryRead[]> {
            const signalOptions = withSignal(
                options.signal,
            )

            const path = options.inUse === true
                ? '/categories?in_use=true'
                : '/categories'

            return signalOptions === undefined
                ? client.getJson<CategoryRead[]>(
                    path,
                )
                : client.getJson<CategoryRead[]>(
                    path,
                    signalOptions,
                )
        },

        async get(
            categoryId: string,
            options: ApiCallOptions = {},
        ): Promise<CategoryRead> {
            return client.getJson<CategoryRead>(
                `/categories/${encodeURIComponent(categoryId)}`,
                withSignal(options.signal),
            )
        },

        async create(
            category: CategoryCreate,
            options: ApiCallOptions = {},
        ): Promise<CategoryRead> {
            return client.requestJson<CategoryRead>(
                '/categories',
                {
                    method: 'POST',
                    body: pickCategoryCreate(category),
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            categoryId: string,
            category: CategoryUpdate,
            options: ApiCallOptions = {},
        ): Promise<CategoryRead> {
            return client.requestJson<CategoryRead>(
                `/categories/${encodeURIComponent(categoryId)}`,
                {
                    method: 'PATCH',
                    body: pickCategoryUpdate(category),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            categoryId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/categories/${encodeURIComponent(categoryId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
