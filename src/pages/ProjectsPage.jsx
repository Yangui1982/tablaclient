import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import UploadForm from '../components/UploadForm'

export default function ProjectsPage() {
  const { data, isLoading, error, refetch } = useProjects()
  const [openingId, setOpeningId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  if (isLoading) return <p>Chargement…</p>
  if (error) return <p>Erreur: {String(error.message || error)}</p>

  const projects = data?.data ?? []

  async function openProject(p) {
    setOpeningId(p.id)
    try {
      const res = await fetch(`/api/v1/projects/${p.id}/scores`, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('jwt'),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = await res.json()
      const scores = payload?.data || payload?.scores || payload || []
      if (!Array.isArray(scores) || scores.length === 0) {
        alert('Ce projet ne contient pas encore de partitions.')
        return
      }
      navigate(`/projects/${p.id}/scores/${scores[0].id}`)
    } catch (e) {
      alert(`Échec de l’ouverture: ${e?.message || e}`)
    } finally {
      setOpeningId(null)
    }
  }

  async function deleteProject(p) {
    if (!window.confirm(`Supprimer le projet « ${p.title || p.id} » ?`)) return
    setDeletingId(p.id)
    try {
      const res = await fetch(`/api/v1/projects/${p.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('jwt'),
        },
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }
      // Rafraîchir la liste via React Query
      await refetch()
    } catch (e) {
      alert(`Échec de la suppression: ${e?.message || e}`)
    } finally {
      setDeletingId(null)
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
                <td style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    className="btn"
                    onClick={() => openProject(p)}
                    disabled={openingId === p.id || deletingId === p.id}
                  >
                    {openingId === p.id ? 'Ouverture…' : 'Ouvrir'}
                  </button>

                  <button
                    onClick={() => deleteProject(p)}
                    disabled={deletingId === p.id || openingId === p.id}
                    aria-label={`Supprimer le projet ${p.title}`}
                    title="Supprimer le projet"
                    style={{
                      border: '1px solid #ddd',
                      background: deletingId === p.id ? '#f8d7da' : 'white',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: deletingId === p.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i>
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
