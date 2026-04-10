import { useEffect } from 'react'
import { useHybridStorage } from './useHybridStorage'

const DEFAULT_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
]

const DEFAULT_EMOJIS = ['🚀', '📱', '🎨', '📊', '🛠️', '📝', '💡', '🎯']

/**
 * Generates a unique project ID
 */
function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

/**
 * Generates a default project name based on existing projects
 */
function generateName(projects) {
  const activeCount = projects.filter(p => !p.archived).length
  return `Project ${activeCount + 1}`
}

/**
 * Creates a blank project object with defaults
 */
function createBlankProject(name, existingProjects = []) {
  const index = existingProjects.length % DEFAULT_COLORS.length
  return {
    id: generateId(),
    name,
    emoji: DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length],
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    archived: false,
    createdAt: new Date().toISOString(),

    // Calculator inputs
    totalValue: 500,
    totalUnit: 'hour',
    dailyValue: 8,
    dailyUnit: 'hour',
    startDate: new Date().toISOString().split('T')[0],
    workingDays: [1, 2, 3, 4, 5],
    excludedDates: [],

    // Per-project notes, tasks, completed days
    dateData: {},

    // Last calculation result (serializable fields only)
    result: null
  }
}

/**
 * Migrates legacy flat localStorage keys into a single Project 1
 * Called once on first load if 'projects' key doesn't exist yet
 */
function migrateLegacyData() {
  try {
    const hasProjects = localStorage.getItem('projects')
    if (hasProjects) return null // Already migrated

    // Check if any legacy data exists
    const totalValue = localStorage.getItem('totalValue')
    if (!totalValue) return null // No legacy data, fresh start

    const today = new Date().toISOString().split('T')[0]

    const legacyProject = {
      id: generateId(),
      name: 'Project 1',
      emoji: '🚀',
      color: DEFAULT_COLORS[0],
      archived: false,
      createdAt: new Date().toISOString(),

      totalValue: JSON.parse(localStorage.getItem('totalValue') || '500'),
      totalUnit: JSON.parse(localStorage.getItem('totalUnit') || '"hour"'),
      dailyValue: JSON.parse(localStorage.getItem('dailyValue') || '8'),
      dailyUnit: JSON.parse(localStorage.getItem('dailyUnit') || '"hour"'),
      startDate: JSON.parse(localStorage.getItem('startDate') || `"${today}"`),
      workingDays: JSON.parse(localStorage.getItem('workingDays') || '[1,2,3,4,5]'),
      excludedDates: JSON.parse(localStorage.getItem('excludedDates') || '[]'),
      dateData: JSON.parse(localStorage.getItem('dateData') || '{}'),
      result: null
    }

    return legacyProject
  } catch (e) {
    console.error('Migration error:', e)
    return null
  }
}

/**
 * useProjects — central hook for all project management
 *
 * Returns:
 *   projects, activeProject, activeProjectId,
 *   setActiveProjectId, createProject, updateProject,
 *   updateActiveProject, duplicateProject,
 *   archiveProject, unarchiveProject, deleteProject
 */
export function useProjects() {
  const [projects, setProjects] = useHybridStorage('projects', [])
  const [activeProjectId, setActiveProjectId] = useHybridStorage('activeProjectId', null)

  // ─── Migration: run once on first load ───────────────────────────────────
  useEffect(() => {
    if (projects.length === 0) {
      const legacy = migrateLegacyData()
      if (legacy) {
        setProjects([legacy])
        setActiveProjectId(legacy.id)
      } else {
        // Truly fresh start — create default project
        const fresh = createBlankProject('Project 1', [])
        setProjects([fresh])
        setActiveProjectId(fresh.id)
      }
    } else if (!activeProjectId || !projects.find(p => p.id === activeProjectId)) {
      // Active ID is stale — default to first active project
      const first = projects.find(p => !p.archived) || projects[0]
      if (first) setActiveProjectId(first.id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived ─────────────────────────────────────────────────────────────
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null

  // ─── Switch project (auto-saves current via useHybridStorage) ────────────
  const switchProject = (id) => {
    setActiveProjectId(id)
  }

  // ─── Update any fields on the active project ─────────────────────────────
  const updateActiveProject = (fields) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, ...fields } : p
    ))
  }

  // ─── Update any project by id ────────────────────────────────────────────
  const updateProject = (id, fields) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, ...fields } : p
    ))
  }

  // ─── Create a new blank project and switch to it ─────────────────────────
  const createProject = () => {
    const name = generateName(projects)
    const newProject = createBlankProject(name, projects)
    setProjects(prev => [...prev, newProject])
    setActiveProjectId(newProject.id)
    return newProject
  }

  // ─── Duplicate a project ─────────────────────────────────────────────────
  const duplicateProject = (id) => {
    const source = projects.find(p => p.id === id)
    if (!source) return

    const duplicate = {
      ...source,
      id: generateId(),
      name: `${source.name} (copy)`,
      archived: false,
      createdAt: new Date().toISOString(),
      // Deep-copy nested objects
      workingDays: [...source.workingDays],
      excludedDates: [...source.excludedDates],
      dateData: JSON.parse(JSON.stringify(source.dateData || {})),
    }

    setProjects(prev => [...prev, duplicate])
    setActiveProjectId(duplicate.id)
    return duplicate
  }

  // ─── Archive / unarchive ─────────────────────────────────────────────────
  const archiveProject = (id) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, archived: true } : p
    ))
    // If we archived the active project, switch to next available
    if (id === activeProjectId) {
      const next = projects.find(p => p.id !== id && !p.archived)
      if (next) {
        setActiveProjectId(next.id)
      } else {
        // No active projects left — create a fresh one
        const fresh = createBlankProject(generateName(projects), projects)
        setProjects(prev => [...prev, fresh])
        setActiveProjectId(fresh.id)
      }
    }
  }

  const unarchiveProject = (id) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, archived: false } : p
    ))
  }

  // ─── Permanent delete (only allowed on archived projects) ────────────────
  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return {
    projects,
    activeProject,
    activeProjectId,
    switchProject,
    createProject,
    updateProject,
    updateActiveProject,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject,
  }
}