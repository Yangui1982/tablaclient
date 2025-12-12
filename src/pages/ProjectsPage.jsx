import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects, listScores } from '../api/endpoints.js'

export default function ProjectsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState(null) // pour feedback sur le bouton
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    listProjects()
      .then((d) => { if (mounted) { setData(d); setLoading(false) } })
      .catch((e) => { if (mounted) { setError(e); setLoading(false) } })
    return () => { mounted = false }
  }, [])

  if (loading) return <p>Chargement…</p>
  if (error)   return <p>Erreur: {String(error.message || error)}</p>

  const projects = data?.data ?? []

  async function openProject(p) {
    setOpeningId(p.id)
    try {
      // On récupère la liste des scores du projet (sans doc pour aller vite)
      const scoresRes = await listScores(p.id, { withDoc: false })
      const scores = scoresRes?.data ?? []
      if (scores.length === 0) {
        alert('Ce projet ne contient pas encore de partitions.')
        return
      }
      const first = scores[0]
      navigate(`/projects/${p.id}/scores/${first.id}`)
    } catch (e) {
      alert('Impossible d’ouvrir le projet. Détail: ' + (e?.message || e))
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div>
      <h1>Projets</h1>
      {projects.length === 0 ? (
        <p>Aucun projet</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Titre</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}># Partitions (approx.)</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }} />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>{p.title}</strong>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {/* Si l’API n’imbrique pas les scores, on n’affiche qu’un indicatif */}
                  {Array.isArray(p.scores) ? p.scores.length : '—'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <button
                    className="btn"
                    onClick={() => openProject(p)}
                    disabled={openingId === p.id}
                  >
                    {openingId === p.id ? 'Ouverture…' : 'Ouvrir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
