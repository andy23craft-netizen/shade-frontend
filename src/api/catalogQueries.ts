import { useMutation, useQuery } from '@tanstack/react-query'
import { createCatalogApi } from './catalogApi'
import { useConnection } from '../features/connection/useConnection'

export function useRecentAdditions(take = 10) {
    const { apiClient } = useConnection()
    const catalogApi = createCatalogApi(apiClient)
    return useQuery({ queryKey: ['catalog', 'recent-additions', take], queryFn: () => catalogApi.recentAdditions(take) })
}

/** Image bytes live only for this mutation; results are deliberately not cached. */
export function useCatalogImageSearch() {
    const { apiClient } = useConnection()
    const catalogApi = createCatalogApi(apiClient)
    return useMutation({ mutationFn: (image: File) => catalogApi.searchImage(image) })
}
