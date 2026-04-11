import { createContext, useContext } from 'react'
import { useProjects } from '../hooks/useProjects'

/**
 * ProjectContext
 *
 * This is the fix for the "UI doesn't update without refresh" bug.
 *
 * The problem: useProjects() was called independently in App, Calculator,
 * and ResultsDisplay. Each call creates its own isolated useState instance.
 * When one component updates state, the others never re-render because
 * they're reading from their own separate copy.
 *
 * The fix: useProjects() is called ONCE here at the top of the tree.
 * All components read from and write to this single shared instance
 * via useProjectContext(). Any update anywhere triggers a re-render
 * everywhere that consumes the context.
 */

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const projects = useProjects()

  return (
    <ProjectContext.Provider value={projects}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjectContext must be used inside ProjectProvider')
  return ctx
}