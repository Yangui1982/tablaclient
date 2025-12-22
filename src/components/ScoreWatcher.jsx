import { useScore } from '../hooks/useScore'

/**
 * Observe un score jusqu'à ready|failed,
 * affiche l’état, l’erreur éventuelle,
 * et rend ses enfants quand ready.
 */
export default function ScoreWatcher({ projectId, scoreId, children }) {
  const { data: score, isLoading, error } = useScore(projectId, scoreId, { withDoc: true })
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
