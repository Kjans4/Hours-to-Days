import Calculator from './components/Calculator'

function App() {
  return (
    <div className="app-container">
      {/* Compact Header */}
      <header className="app-header compact">
        <div className="header-content">
          <div className="header-left">
            <span className="header-icon">⏱️</span>
            <h1 className="header-title">Hours to Days</h1>
          </div>
          <p className="header-tagline">Project timeline calculator</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-compact">
        <Calculator />
      </main>

      {/* Compact Footer */}
      <footer className="app-footer compact">
        <p>© 2026 Hours to Days</p>
      </footer>
    </div>
  )
}

export default App