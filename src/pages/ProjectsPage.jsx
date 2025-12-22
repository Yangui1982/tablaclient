import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import UploadForm from '../components/UploadForm'

export default function ProjectsPage() {
  const { data, isLoading, error } = useProjects()
  const [openingId, setOpeningId] = useState(null)
  const navigate = useNavigate()

  if (isLoading) return <p>Chargement…</p>
  if (error) return <p>Erreur: {String(error.message || error)}</p>

  const projects = data?.data ?? []

  async function openProject(p) {
    setOpeningId(p.id)
    try {
      // on peut lire via hook imperatif en créant un composant, mais ici simple fallback:
      const res = await fetch(`/api/v1/projects/${p.id}/scores`, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + localStorage.getItem('jwt') } })
      const payload = await res.json()
      const scores = payload?.data || payload?.scores || payload || []
      if (!Array.isArray(scores) || scores.length === 0) {
        alert('Ce projet ne contient pas encore de partitions.')
        return
      }
      navigate(`/projects/${p.id}/scores/${scores[0].id}`)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div>
      <h1>Projets</h1>

      <div style={{ marginBottom: 16 }}>
        <UploadForm />
      </div>

      {projects.length === 0 ? (
        <p>Aucun projet</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Titre</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}># Partitions (approx.)</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  <strong>{p.title}</strong>
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  {Array.isArray(p.scores) ? p.scores.length : '—'}
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  <button className="btn" onClick={() => openProject(p)} disabled={openingId === p.id}>
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
