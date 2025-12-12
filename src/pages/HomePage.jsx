import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div style={{ maxWidth: 420, margin: '6rem auto', textAlign: 'center' }}>
      <h1>Bienvenue</h1>
      <p style={{ margin: '1rem 0 2rem' }}>
        Accéder à l’interface nécessite une connexion.
      </p>
      <Link className="btn" to="/login" aria-label="Aller à la page de connexion">
        Se connecter
      </Link>
    </div>
  )
}
