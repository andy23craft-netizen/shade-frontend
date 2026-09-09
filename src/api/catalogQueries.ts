import { useQuery } from '@tanstack/react-query'
import { createCatalogApi } from './catalogApi'
import { useConnection } from '../features/connection/useConnection'

export function useRecentAdditions(take = 10) {
    const { apiClient } = useConnection()
    const catalogApi = createCatalogApi(apiClient)
    return useQuery({ queryKey: ['catalog', 'recent-additions', take], queryFn: () => catalogApi.recentAdditions(take) })
}
