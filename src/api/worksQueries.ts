import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createWorksApi } from './worksApi'
import { useConnection } from '../features/connection/useConnection'
import { queryKeys } from './queryKeys'

function invalidateWorkCorrection(client: ReturnType<typeof useQueryClient>) {
    return Promise.all([client.invalidateQueries({ queryKey: queryKeys.books.all }), client.invalidateQueries({ queryKey: queryKeys.loans.all }), client.invalidateQueries({ queryKey: ['works'] })])
}
export function useWork(id: string, enabled: boolean) {
    const { apiClient } = useConnection(); const api = createWorksApi(apiClient)
    return useQuery({ queryKey: ['works', id], queryFn: () => api.get(id), enabled: Boolean(id) && enabled })
}
export function useMergeWorks() {
    const { apiClient } = useConnection(); const client = useQueryClient(); const api = createWorksApi(apiClient)
    return useMutation({ mutationFn: ({ targetId, sourceWorkIds }: { targetId: string; sourceWorkIds: string[] }) => api.merge(targetId, sourceWorkIds), onSuccess: () => invalidateWorkCorrection(client) })
}
export function useSplitWork() {
    const { apiClient } = useConnection(); const client = useQueryClient(); const api = createWorksApi(apiClient)
    return useMutation({ mutationFn: ({ id, itemIds }: { id: string; itemIds: string[] }) => api.split(id, itemIds), onSuccess: () => invalidateWorkCorrection(client) })
}
