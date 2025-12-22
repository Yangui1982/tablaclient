import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { uploadScore } from '../api/endpoints.js'

export default function UploadForm() {
  const [file, setFile] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!file) return setError('Sélectionnez un fichier.')
    if (!projectId && !projectTitle) return setError('Project ID ou titre requis.')

    try {
      setLoading(true)
      const res = await uploadScore({
        file,
        projectId: projectId || undefined,
        projectTitle: projectTitle || undefined,
      })
      const pid = res.project_id
      const sid = res.score_id
      if (!pid || !sid) throw new Error('Réponse upload incomplète.')
      // invalide la liste des scores pour ce projet
      qc.invalidateQueries({ queryKey: ['scores', pid] })
      navigate(`/projects/${pid}/scores/${sid}`)
    } catch (e2) {
      setError(e2?.message || "Échec de l'upload")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      {error && (
        <div role="alert" style={{ marginBottom: 12, background: '#fee', border: '1px solid #c00', padding: '6px 10px' }}>{error}</div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label>Fichier partition</label><br />
        <input
          type="file"
          accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp5,.midi,.mid,.musicxml,.xml,.mxl,.gpif,.gpbank,.gpw" // ajuste selon ton backend
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div>
          <label>ID projet (optionnel)</label><br />
          <input type="number" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
        <div>
          <label>Titre projet (si pas d’ID)</label><br />
          <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Nouveau projet" />
        </div>
      </div>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Upload…' : 'Uploader'}
      </button>
    </form>
  )
}
