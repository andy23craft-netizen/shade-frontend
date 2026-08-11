import type {
    QueryClient,
} from '@tanstack/react-query'
import {
    subscribeToConnectionInvalidation,
} from '../features/connection/connectionInvalidation'

export function subscribeQueryClientToConnectionInvalidation(
    queryClient: QueryClient,
): () => void {
    return subscribeToConnectionInvalidation(() => {
        queryClient.clear()
    })
}
