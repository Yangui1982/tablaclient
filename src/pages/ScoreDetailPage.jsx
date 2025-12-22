import { useParams, Link } from 'react-router-dom'
import ScoreWatcher from '../components/ScoreWatcher'

export default function ScoreDetailPage() {
  const { projectId, scoreId } = useParams()

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link className="link-btn" to="/projects">← Retour aux projets</Link>
      </p>

      <ScoreWatcher projectId={projectId} scoreId={scoreId}>
        {(score) => {
          const doc = score?.doc || {}
          const previewPngs = score?.preview_png_urls || []

          return (
            <div>
              <h1 style={{ marginBottom: 8 }}>{score.title}</h1>

              <div style={{ marginBottom: 16, color: '#444' }}>
                <div><strong>Status :</strong> {score.status}</div>
                {typeof score.tempo === 'number' && (
                  <div><strong>Tempo :</strong> {score.tempo} bpm</div>
                )}
                {Array.isArray(doc.tracks) && (
                  <div><strong>Pistes :</strong> {doc.tracks.length}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {score.midi_url && (
                  <a className="link-btn" href={score.midi_url} target="_blank" rel="noreferrer">
                    Télécharger MIDI
                  </a>
                )}
                {score.preview_pdf_url && (
                  <a className="link-btn" href={score.preview_pdf_url} target="_blank" rel="noreferrer">
                    Aperçu PDF
                  </a>
                )}
                {score.source_url && (
                  <a className="link-btn" href={score.source_url} target="_blank" rel="noreferrer">
                    Fichier source
                  </a>
                )}
              </div>

              {Array.isArray(previewPngs) && previewPngs.length > 0 ? (
                <div>
                  <h2>Aperçus</h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {previewPngs.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                        <img
                          src={url}
                          alt={`Aperçu page ${i + 1}`}
                          style={{ width: '100%', height: 'auto', border: '1px solid #ddd' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p>Aucun aperçu PNG disponible.</p>
              )}
            </div>
          )
        }}
      </ScoreWatcher>
    </div>
  )
}
