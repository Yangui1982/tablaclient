import { useQuery } from '@tanstack/react-query'
import { getScore } from '../api/endpoints.js'

export function useScore(projectId, scoreId, { withDoc = true } = {}) {
  return useQuery({
    queryKey: ['score', projectId, scoreId, { withDoc }],
    queryFn: () => getScore(projectId, scoreId, { withDoc }),
    enabled: !!projectId && !!scoreId,
    select: (payload) => payload?.data || payload?.score || payload, // tolérant
    refetchInterval: (data) => {
      const status = data?.status
      return status === 'processing' ? 1500 : false
    },
  })
}
