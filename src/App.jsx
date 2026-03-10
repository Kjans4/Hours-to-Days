import { useState } from 'react'
import Calculator from './components/Calculator'
import Auth from './components/Auth'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header compact">
        <div className="header-content">
          <div className="header-left">
            <span className="header-icon">⏱️</span>
            <h1 className="header-title">Hours to Days</h1>
          </div>
          
          {/* ADD THIS LOGIN BUTTON */}
          <button 
            className="login-btn"
            onClick={() => setShowAuth(true)}
          >
            {user ? `👤 ${user.email}` : '🔑 Sign In'}
          </button>
        </div>
      </header>

      <main className="main-compact">
        <Calculator />
      </main>

      <footer className="app-footer compact">
        <p>© 2026 Hours to Days</p>
      </footer>

      {/* Auth Modal */}
      {showAuth && <Auth user={user} onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default App