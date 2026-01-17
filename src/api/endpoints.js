import { api, setToken, clearToken } from './client'

function extractToken(res) {
  let t = res?.headers?.authorization || res?.headers?.Authorization
  if (t && t.startsWith('Bearer ')) t = t.slice(7)
  if (!t && res?.data && typeof res.data === 'object') {
    t = res.data.token || res.data.jwt || res.data.access_token
  }
  return t
}

function assertOk(res, ctx = 'Request failed') {
  if (res.status >= 200 && res.status < 300) return res
  const msg = res.data?.error || res.statusText || String(res.status)
  const e = new Error(`${ctx}: ${msg}`)
  e.status = res.status
  e.data = res.data
  throw e
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password }, { validateStatus: () => true })
  assertOk(res, 'Login')
  const t = extractToken(res)
  if (!t) throw new Error('Login: token introuvable')
  setToken(t)
  return t
}

export async function logout() {
  try {
    const res = await api.delete('/auth/logout', { validateStatus: () => true })
    assertOk(res, 'Logout')
  } finally {
    clearToken()
  }
}

export async function listProjects(params = {}) {
  const res = await api.get('/projects', { params })
  return res.data
}

export async function listScores(projectId, { page, per, withDoc } = {}) {
  const res = await api.get(`/projects/${projectId}/scores`, {
    params: { page, per, with_doc: withDoc ? 'true' : undefined },
  })
  return res.data
}

export async function getScore(projectId, scoreId, opts = {}) {
  const params = {}
  if (opts.withDoc) params.with_doc = 'true'
  if (typeof opts.trackIndex === 'number') params.track_index = String(opts.trackIndex)

  const res = await api.get(`/projects/${projectId}/scores/${scoreId}`, { params })
  return res.data
}

// Optionnel: upload
export async function uploadScore({ file, projectId, projectTitle, scoreId, scoreTitle }) {
  if (!file) throw new Error('uploadScore: "file" est requis')
  const fd = new FormData()
  fd.append('file', file)
  if (projectId != null) fd.append('project_id', String(projectId))
  else if (projectTitle) fd.append('project_title', projectTitle)
  else throw new Error('uploadScore: fournir "projectId" ou "projectTitle"')
  if (scoreId != null) fd.append('score_id', String(scoreId))
  if (scoreTitle) fd.append('score_title', scoreTitle)
  const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' }, validateStatus: () => true })
  assertOk(res, 'Upload')
  return res.data
}

export async function deleteProject(projectId) {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
}
