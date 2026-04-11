import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ProjectProvider } from './components/ProjectContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </React.StrictMode>,
)