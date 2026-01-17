import { useQuery } from '@tanstack/react-query'
import { getScore } from '../api/endpoints.js'
import { normalizeScore } from '../music/normalizeScore.js'

export function useScore(projectId, scoreId, { withDoc = true, trackIndex = 0 } = {}) {
  return useQuery({
    // trackIndex dans la clé => changer de piste => nouveau fetch (doc “léger” différent)
    queryKey: ['score', projectId, scoreId, { withDoc: !!withDoc, trackIndex }],
    queryFn: () => getScore(projectId, scoreId, { withDoc, trackIndex }),
    enabled: !!projectId && !!scoreId,

    // 1) normalise le payload vers "score"
    // 2) si doc présent => ajoute score.model
    select: (payload) => {
      const score = payload?.data || payload?.score || payload
      if (!score) return score

      const doc = score?.doc
      if (!doc) return score

      // Ajoute un modèle normalisé (ticks/mesures) sans supprimer doc
      try {
        return { ...score, model: normalizeScore(doc) }
      } catch (e) {
        // En cas de doc inattendu, on ne casse pas le rendu existant
        console.error('[useScore] normalizeScore failed:', e)
        return score
      }
    },

    refetchInterval: (data) => {
      const status = data?.status
      return status === 'processing' ? 1500 : false
    },
  })
}
