import { useState, useRef, useEffect } from 'react'
import ProjectModal from './ProjectModal'

function ProjectSwitcher({
  projects,
  activeProject,
  onSwitch,
  onCreate,
  onUpdate,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const [open, setOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const dropdownRef = useRef(null)

  // FIX #4: Listen on both mousedown (desktop) AND touchstart (mobile).
  // Previously only mousedown was used, so tapping outside on a phone
  // never closed the dropdown.
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  const activeProjects = projects.filter(p => !p.archived)
  const archivedProjects = projects.filter(p => p.archived)

  const handleSwitch = (id) => {
    onSwitch(id)
    setOpen(false)
    setMenuOpenId(null)
  }

  const handleCreate = () => {
    onCreate()
    setOpen(false)
  }

  const handleEditSave = ({ name, emoji, color }) => {
    if (editingProject) {
      onUpdate(editingProject.id, { name, emoji, color })
    }
    setEditingProject(null)
  }

  const handleDuplicate = (id) => {
    onDuplicate(id)
    setMenuOpenId(null)
    setOpen(false)
  }

  const handleArchive = (id) => {
    onArchive(id)
    setMenuOpenId(null)
    setOpen(false) // FIX #10: also close dropdown after archiving
  }

  const handleUnarchive = (id) => {
    onUnarchive(id)
    setMenuOpenId(null)
  }

  const handleDeleteConfirm = (id) => {
    setConfirmDeleteId(id)
    setMenuOpenId(null)
  }

  const handleDeleteFinal = () => {
    onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    setMenuOpenId(prev => prev === id ? null : id)
  }

  return (
    <>
      <div className="project-switcher" ref={dropdownRef}>
        {/* Trigger button */}
        <button
          className="project-switcher-trigger"
          onClick={() => setOpen(prev => !prev)}
          style={{ '--project-color': activeProject?.color || '#2563eb' }}
        >
          <span className="ps-emoji">{activeProject?.emoji || '🚀'}</span>
          <span className="ps-name">{activeProject?.name || 'Select Project'}</span>
          <span className={`ps-chevron ${open ? 'ps-chevron--open' : ''}`}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="ps-dropdown">
            {/* FIX #8: Removed overflow:hidden from ps-dropdown-inner (in CSS).
                The scrollable list and sticky footer are now separated so the
                context menu is never clipped. */}
            <div className="ps-dropdown-list">
              {/* Active projects */}
              <div className="ps-section-label">Active</div>
              {activeProjects.length === 0 && (
                <p className="ps-empty">No active projects</p>
              )}
              {activeProjects.map(p => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  isActive={p.id === activeProject?.id}
                  menuOpen={menuOpenId === p.id}
                  onSelect={() => handleSwitch(p.id)}
                  onToggleMenu={(e) => toggleMenu(e, p.id)}
                  onEdit={() => { setEditingProject(p); setMenuOpenId(null) }}
                  onDuplicate={() => handleDuplicate(p.id)}
                  onArchive={() => handleArchive(p.id)}
                  showArchiveOption={true}
                />
              ))}

              {/* Archived section toggle */}
              {archivedProjects.length > 0 && (
                <>
                  <button
                    className="ps-archived-toggle"
                    onClick={() => setShowArchived(v => !v)}
                  >
                    <span>Archived ({archivedProjects.length})</span>
                    <span>{showArchived ? '▲' : '▼'}</span>
                  </button>

                  {showArchived && archivedProjects.map(p => (
                    <ProjectRow
                      key={p.id}
                      project={p}
                      isActive={false}
                      isArchived={true}
                      menuOpen={menuOpenId === p.id}
                      onSelect={() => {}}
                      onToggleMenu={(e) => toggleMenu(e, p.id)}
                      onEdit={() => { setEditingProject(p); setMenuOpenId(null) }}
                      onDuplicate={() => handleDuplicate(p.id)}
                      onUnarchive={() => handleUnarchive(p.id)}
                      onDelete={() => handleDeleteConfirm(p.id)}
                      showArchiveOption={false}
                    />
                  ))}
                </>
              )}
            </div>

            {/* FIX #8 + #15: Sticky footer outside the scrollable list.
                The New Project button is always visible and never clipped. */}
            <div className="ps-dropdown-footer">
              <div className="ps-divider" />
              <button className="ps-new-btn" onClick={handleCreate}>
                <span className="ps-new-icon">＋</span>
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <ProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onSave={handleEditSave}
      />

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="ps-confirm-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="ps-confirm" onClick={e => e.stopPropagation()}>
            <p>Permanently delete this project? This cannot be undone.</p>
            <div className="ps-confirm-actions">
              <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="ps-confirm-delete" onClick={handleDeleteFinal}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Project Row ─────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  isActive,
  isArchived,
  menuOpen,
  onSelect,
  onToggleMenu,
  onEdit,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
  showArchiveOption,
}) {
  const menuBtnRef = useRef(null)
  const [flipUp, setFlipUp] = useState(false)

  useEffect(() => {
    if (!menuOpen || !menuBtnRef.current) {
      setFlipUp(false)
      return
    }
    const btnRect = menuBtnRef.current.getBoundingClientRect()
    const estimatedMenuHeight = 180
    const spaceBelow = window.innerHeight - btnRect.bottom
    const spaceAbove = btnRect.top
    setFlipUp(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow)
  }, [menuOpen])

  return (
    <div
      className={`ps-row ${isActive ? 'ps-row--active' : ''} ${isArchived ? 'ps-row--archived' : ''}`}
      onClick={!isArchived ? onSelect : undefined}
      style={isActive ? { borderLeftColor: project.color } : {}}
    >
      <span className="ps-row-emoji">{project.emoji}</span>
      <span className="ps-row-name">{project.name}</span>

      {isActive && (
        <span className="ps-row-check" style={{ color: project.color }}>✓</span>
      )}

      <button
        ref={menuBtnRef}
        className="ps-row-menu-btn"
        onClick={onToggleMenu}
        title="More options"
      >
        •••
      </button>

      {menuOpen && (
        <div
          className={`ps-context-menu ${flipUp ? 'ps-context-menu--flip' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onEdit}>✏️ Rename</button>
          <button onClick={onDuplicate}>📋 Duplicate</button>
          {showArchiveOption && (
            <button onClick={onArchive}>📦 Archive</button>
          )}
          {isArchived && (
            <>
              <button onClick={onUnarchive}>♻️ Restore</button>
              <button className="ps-menu-delete" onClick={onDelete}>
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectSwitcher