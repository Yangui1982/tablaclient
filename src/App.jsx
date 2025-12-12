import { Routes, Route, Link } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ScoreDetailPage from './pages/ScoreDetailPage'
import HomePage from './pages/HomePage'
import './App.css'

function App() {
  const loggedIn = !!localStorage.getItem('jwt')
  const logout = () => {
    localStorage.removeItem('jwt')
    window.location.assign('/login')
  }

  return (
    <div>
      <header className="app-header">
        <nav className="app-nav" aria-label="Navigation principale">
          <Link to="/">Accueil</Link>             {/* lien vers la racine */}
          <Link to="/projects">Projets</Link>
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          {loggedIn ? (
            <button className="btn" onClick={logout}>Logout</button>
          ) : (
            <Link className="link-btn" to="/login">Login</Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />           {/* <= route racine */}
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId/scores/:scoreId" element={<ScoreDetailPage />} />
          </Route>
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
