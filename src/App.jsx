import { useState } from 'react'
import Calculator from './components/Calculator'
import Auth from './components/Auth'
import Navigation from './components/Navigation'
import ProjectSwitcher from './components/ProjectSwitcher'
import { useAuth } from './hooks/useAuth'
import { useProjectContext } from './components/ProjectContext'

function App() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const {
    projects,
    activeProject,
    switchProject,
    createProject,
    updateProject,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject,
  } = useProjectContext()

  if (loading) {
    return (
      <div className="loading">
        <img src="/clock.svg" alt="Loading" className="loading-logo" />
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header compact">
        <div className="header-content">
          <div className="header-left">
            <img src="/clock.svg" alt="Hours to Days Logo" className="header-logo" />
            <h1 className="header-title">Hours to Days</h1>
          </div>

          <div className="header-right">
            <ProjectSwitcher
              projects={projects}
              activeProject={activeProject}
              onSwitch={switchProject}
              onCreate={createProject}
              onUpdate={updateProject}
              onDuplicate={duplicateProject}
              onArchive={archiveProject}
              onUnarchive={unarchiveProject}
              onDelete={deleteProject}
            />
            <button
              className="login-btn"
              onClick={() => setShowAuth(true)}
            >
              {user ? `👤 ${user.email}` : '🔑 Sign In'}
            </button>
          </div>
        </div>
      </header>

      <Navigation />

      <main className="main-compact">
        <Calculator activeProject={activeProject} />
      </main>

      <footer className="app-footer compact">
        <p>© 2026 Hours to Days Calculator</p>
      </footer>

      {showAuth && <Auth user={user} onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default App