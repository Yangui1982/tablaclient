import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import ScoreWatcher from '../components/ScoreWatcher'
import TabViewerPro from '../components/TabViewerPro'

export default function ScoreDetailPage() {
  const { projectId, scoreId } = useParams()
  const [trackIndex, setTrackIndex] = useState(0)

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link className="link-btn" to="/projects">← Retour aux projets</Link>
      </p>

      <ScoreWatcher projectId={projectId} scoreId={scoreId} trackIndex={trackIndex}>
        {(score) => {
          const doc = score?.doc || null
          const model = score?.model || null
          const tracks = Array.isArray(doc?.tracks) ? doc.tracks : []

          const firstMeasureEventsLen = model?.measures?.[0]?.events?.length ?? 0

          return (
            <div>
              <h1 style={{ marginBottom: 8 }}>{score?.title || 'Score'}</h1>

              <div style={{ marginBottom: 16, color: '#444' }}>
                <div><strong>Status :</strong> {score?.status}</div>

                {typeof score?.tempo === 'number' && (
                  <div><strong>Tempo :</strong> {score.tempo} bpm</div>
                )}

                {doc && (
                  <div><strong>Pistes (dans le doc renvoyé) :</strong> {tracks.length}</div>
                )}

                {model && (
                  <div>
                    <strong>Model :</strong> TPQ {model.tpq} — TPM {model.ticksPerMeasure} — mesures {model.measures?.length}
                    {typeof model.measureStartIndex === 'number' && (
                      <> — startIndex {model.measureStartIndex}</>
                    )}
                    <> — events mesure 0 (utile) : {firstMeasureEventsLen}</>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {score?.midi_url && (
                  <a className="link-btn" href={score.midi_url} target="_blank" rel="noreferrer">
                    Télécharger MIDI
                  </a>
                )}
                {score?.source_url && (
                  <a className="link-btn" href={score.source_url} target="_blank" rel="noreferrer">
                    Fichier source
                  </a>
                )}
                {score?.normalized_mxl_url && (
                  <a className="link-btn" href={score.normalized_mxl_url} target="_blank" rel="noreferrer">
                    Canon MXL
                  </a>
                )}
              </div>

              {/* Sélection piste : on refetch une track “légère” */}
              <div style={{ marginBottom: 12 }}>
                <label>
                  Track à afficher (track_index):&nbsp;
                  <input
                    type="number"
                    min="0"
                    value={trackIndex}
                    onChange={(e) => setTrackIndex(Number(e.target.value))}
                    style={{ width: 80 }}
                  />
                </label>
                <span style={{ marginLeft: 10, color: '#666' }}>
                  (0 = première piste)
                </span>
              </div>

              {/* Rendu */}
              {model ? (
                // IMPORTANT: on passe le modèle normalisé au viewer
                <TabViewerPro model={model} doc={doc} />
              ) : doc ? (
                // Fallback si model absent (ou si vous n'avez pas encore adapté TabViewerPro)
                <TabViewerPro doc={doc} />
              ) : (
                <p style={{ color: '#666' }}>
                  Aucun doc reçu. (Vérifie que l’appel se fait avec <code>with_doc=true</code>.)
                </p>
              )}
            </div>
          )
        }}
      </ScoreWatcher>
    </div>
  )
}
