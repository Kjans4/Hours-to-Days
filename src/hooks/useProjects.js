import { useEffect } from 'react'
import { useHybridStorage } from './useHybridStorage'

const DEFAULT_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
]

const DEFAULT_EMOJIS = ['🚀', '📱', '🎨', '📊', '🛠️', '📝', '💡', '🎯']

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

function generateName(projects) {
  const activeCount = projects.filter(p => !p.archived).length
  return `Project ${activeCount + 1}`
}

function createBlankProject(name, existingProjects = []) {
  const index = existingProjects.length % DEFAULT_COLORS.length
  return {
    id: generateId(),
    name,
    emoji: DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length],
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    archived: false,
    createdAt: new Date().toISOString(),
    totalValue: 500,
    totalUnit: 'hour',
    dailyValue: 8,
    dailyUnit: 'hour',
    startDate: new Date().toISOString().split('T')[0],
    workingDays: [1, 2, 3, 4, 5],
    excludedDates: [],
    dateData: {},
    result: null
  }
}

function migrateLegacyData() {
  try {
    // Already migrated
    if (localStorage.getItem('projectState')) return null

    const totalValue = localStorage.getItem('totalValue')
    if (!totalValue) return null

    const today = new Date().toISOString().split('T')[0]
    const id = generateId()

    const legacyProject = {
      id,
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

    return { projects: [legacyProject], activeProjectId: id }
  } catch (e) {
    console.error('Migration error:', e)
    return null
  }
}

/**
 * useProjects
 *
 * KEY FIX: projects and activeProjectId are stored together in ONE key
 * ('projectState') so they are ALWAYS updated atomically and never out of sync.
 *
 * KEY FIX: updateActiveProject reads activeProjectId from INSIDE the state
 * updater function, not from a closure — so it always has the latest value.
 */
export function useProjects() {
  // Single key holds both arrays — eliminates the two-key sync problem
  const [state, setState] = useHybridStorage('projectState', null)

  // ─── Initialize / migrate on first load ──────────────────────────────────
  useEffect(() => {
    if (state !== null) return // Already initialized

    const migrated = migrateLegacyData()
    if (migrated) {
      setState(migrated)
      return
    }

    // Fresh start
    const fresh = createBlankProject('Project 1', [])
    setState({ projects: [fresh], activeProjectId: fresh.id })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Safe defaults while state initializes
  const projects = state?.projects || []
  const activeProjectId = state?.activeProjectId || null
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null

  // ─── Internal atomic updater ─────────────────────────────────────────────
  // All mutations go through this — it always works on the latest state
  const update = (updater) => {
    setState(prev => {
      const current = prev || { projects: [], activeProjectId: null }
      const next = updater(current)
      return next
    })
  }

  // ─── Switch project ───────────────────────────────────────────────────────
  const switchProject = (id) => {
    update(s => ({ ...s, activeProjectId: id }))
  }

  // ─── Update fields on the active project ─────────────────────────────────
  // FIX: reads activeProjectId from `s` (current state), not from closure
  const updateActiveProject = (fields) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId ? { ...p, ...fields } : p
      )
    }))
  }

  // ─── Update any project by id ─────────────────────────────────────────────
  const updateProject = (id, fields) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === id ? { ...p, ...fields } : p
      )
    }))
  }

  // ─── Create new project ───────────────────────────────────────────────────
  const createProject = () => {
    update(s => {
      const name = generateName(s.projects)
      const newProject = createBlankProject(name, s.projects)
      return {
        projects: [...s.projects, newProject],
        activeProjectId: newProject.id
      }
    })
  }

  // ─── Duplicate ────────────────────────────────────────────────────────────
  const duplicateProject = (id) => {
    update(s => {
      const source = s.projects.find(p => p.id === id)
      if (!source) return s

      const duplicate = {
        ...source,
        id: generateId(),
        name: `${source.name} (copy)`,
        archived: false,
        createdAt: new Date().toISOString(),
        workingDays: [...source.workingDays],
        excludedDates: [...source.excludedDates],
        dateData: JSON.parse(JSON.stringify(source.dateData || {}))
      }

      return {
        projects: [...s.projects, duplicate],
        activeProjectId: duplicate.id
      }
    })
  }

  // ─── Archive ──────────────────────────────────────────────────────────────
  const archiveProject = (id) => {
    update(s => {
      const updated = s.projects.map(p =>
        p.id === id ? { ...p, archived: true } : p
      )

      let nextActiveId = s.activeProjectId
      if (id === s.activeProjectId) {
        const next = updated.find(p => !p.archived)
        if (next) {
          nextActiveId = next.id
        } else {
          // No active projects left — create one
          const fresh = createBlankProject(generateName(updated), updated)
          updated.push(fresh)
          nextActiveId = fresh.id
        }
      }

      return { projects: updated, activeProjectId: nextActiveId }
    })
  }

  const unarchiveProject = (id) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === id ? { ...p, archived: false } : p
      )
    }))
  }

  // ─── Delete (permanent, archived only) ────────────────────────────────────
  const deleteProject = (id) => {
    update(s => ({
      ...s,
      projects: s.projects.filter(p => p.id !== id)
    }))
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