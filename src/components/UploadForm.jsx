import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { uploadScore } from '../api/endpoints.js'

function deriveTitleFromFilename(name) {
  if (!name) return ''
  // retire l'extension + normalise un peu
  const base = name.replace(/\.[^.]+$/, '')
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function UploadForm() {
  const [file, setFile] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [scoreTitle, setScoreTitle] = useState('') // <-- nouveau
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const qc = useQueryClient()
  const navigate = useNavigate()

  function onFileChange(e) {
    const f = e.target.files?.[0] || null
    setFile(f)

    // Pré-remplissage : uniquement si vide OU si l'utilisateur n'a pas encore modifié
    if (f) {
      setScoreTitle((prev) => (prev && prev.trim().length > 0 ? prev : deriveTitleFromFilename(f.name)))
    } else {
      setScoreTitle('')
    }
  }

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
        scoreTitle: scoreTitle?.trim() || undefined, // <-- envoyé au backend
      })

      const pid = res.project_id
      const sid = res.score_id
      if (!pid || !sid) throw new Error('Réponse upload incomplète.')

      // Invalide les listes pertinentes
      qc.invalidateQueries({ queryKey: ['projects'] })
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
        <div
          role="alert"
          style={{
            marginBottom: 12,
            background: '#fee',
            border: '1px solid #c00',
            padding: '6px 10px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label>Fichier partition</label>
        <br />
        <input
          type="file"
          accept=".gp,.gp3,.gp4,.gp5,.gpx,.midi,.mid,.musicxml,.xml,.mxl,.gpif,.gpbank,.gpw"
          onChange={onFileChange}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Titre de la partition</label>
        <br />
        <input
          type="text"
          value={scoreTitle}
          onChange={(e) => setScoreTitle(e.target.value)}
          placeholder={file ? deriveTitleFromFilename(file.name) : 'Ex: Sweet Home Alabama'}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          Pré-rempli à partir du nom de fichier, modifiable avant upload.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <label>ID projet (optionnel)</label>
          <br />
          <input type="number" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label>Titre projet (si pas d’ID)</label>
          <br />
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Nouveau projet"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Upload…' : 'Uploader'}
      </button>
    </form>
  )
}
