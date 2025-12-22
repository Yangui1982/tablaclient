import { useQuery } from '@tanstack/react-query'
import { listScores } from '../api/endpoints.js'

export function useScores(projectId, opts = {}) {
  return useQuery({
    queryKey: ['scores', projectId, opts],
    queryFn: () => listScores(projectId, opts),
    enabled: !!projectId,
  })
}
