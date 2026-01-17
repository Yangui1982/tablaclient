import { useEffect, useRef } from 'react'
import { useScore } from '../hooks/useScore'

/**
 * Observe un score jusqu'à ready|failed,
 * affiche l’état, l’erreur éventuelle,
 * et rend ses enfants quand ready.
 *
 * trackIndex: permet de demander un doc “léger” (une seule piste) via ?track_index=
 */
export default function ScoreWatcher({ projectId, scoreId, trackIndex = 0, children }) {
  const { data: score, isLoading, error } = useScore(projectId, scoreId, {
    withDoc: true,
    trackIndex,
  })

  // Pour éviter de spammer la console (refetch toutes les 1.5s en "processing")
  const loggedRef = useRef(false)

  useEffect(() => {
    // On log uniquement quand on a un doc exploitable
    if (!score?.doc) return
    if (loggedRef.current) return
    loggedRef.current = true

    const extract = {
      ppq: score.doc.ppq,
      time_signature: score.doc.time_signature,
      note0: score.doc.tracks?.[0]?.notes?.[0],
      note1: score.doc.tracks?.[0]?.notes?.[1],
      note2: score.doc.tracks?.[0]?.notes?.[2],
    }

    console.log('[EXTRACT JSON]', JSON.stringify(extract, null, 2))

    console.log('[HAS MODEL]', !!score?.model)
    if (!score?.model) return

    console.log('[MODEL] normalizeVersion:', score.model.__normalizeVersion)
    console.log('[MODEL] TPQ:', score.model.tpq)
    console.log('[MODEL] TPM:', score.model.ticksPerMeasure)
    console.log('[MODEL] measureStartIndex:', score.model.measureStartIndex)
    console.log('[MODEL] measures:', score.model.measures?.length)

    const firstMeasure = score.model.measures?.[0]
    const firstEventsLen = firstMeasure?.events?.length ?? 0

    console.log('[MODEL] first measure absIndex:', firstMeasure?.absIndex)
    console.log('[MODEL] first measure events length:', firstEventsLen)
    console.log('[MODEL] first measure has events > 0:', firstEventsLen > 0)
    console.log('[MODEL] first events:', firstMeasure?.events?.slice(0, 8))
  }, [score])

  if (isLoading) return <p>Chargement…</p>
  if (error) return <p>Erreur: {String(error.message || error)}</p>

  if (score?.status === 'processing') {
    return <p>Traitement en cours… (rafraîchissement automatique)</p>
  }

  if (score?.status === 'failed') {
    return (
      <div role="alert" style={{ background: '#fee', border: '1px solid #c00', padding: '6px 10px' }}>
        Import échoué: {score?.import_error || 'Erreur inconnue'}
      </div>
    )
  }

  // prêt
  return typeof children === 'function' ? children(score) : children
}
