import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { login } from '../api/endpoints'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state && location.state.from) || '/projects'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ✅ Ne pas naviguer pendant le render : utiliser <Navigate/> ou useEffect
  const token = localStorage.getItem('jwt')
  if (token) {
    return <Navigate to={redirectTo} replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Veuillez renseigner email et mot de passe.')
      return
    }
    try {
      setLoading(true)
      await login(email, password)
      // OK d'appeler navigate après une action utilisateur (submit)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Échec de l’authentification.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '6rem auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Connexion</h1>

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            border: '1px solid #cc0000',
            background: '#ffecec',
          }}
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />

        <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
          Mot de passe
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            id="password"
            name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ flex: 1, padding: 8 }}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-pressed={showPwd}
            className="btn"
          >
            {showPwd ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn"
          style={{ width: '100%' }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
