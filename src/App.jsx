import Calculator from './components/Calculator'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Hours to Days</h1>
        <p>Calculate when you'll finish your project</p>
      </header>
      <main>
        <Calculator />
      </main>
      <footer className="app-footer">
        <p>© 2026 Hours to Days - Free Workday Calculator</p>
      </footer>
    </div>
  )
}

export default App