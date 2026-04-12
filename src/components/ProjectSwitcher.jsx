import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ProjectModal from './ProjectModal'

/**
 * Z-INDEX SCALE (matches all modals across the app)
 *
 *  100  — sticky header / sub-nav
 *  200  — dropdown panel
 *  300  — context menu (must clear the scroll container)
 *  400  — bottom nav (mobile)
 *  500  — confirm backdrop
 *  600  — confirm dialog
 * 1000  — full modals (auth, note)
 * 2000  — toasts
 *
 * Previously: dropdown=500, context=600, confirm=1000, modals=1000, toasts=2000
 * Problem: confirm and modals shared z-index 1000, context menu at 600 could
 * bleed through the confirm backdrop at 1000 in some browser paint orders.
 */

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

  // FIX #8: context menu position measured in viewport coords so it can
  // be rendered via a portal — escaping the scroll container entirely.
  const [contextMenuPos, setContextMenuPos] = useState(null)

  const dropdownRef = useRef(null)

  // FIX #4: listen on touchstart (mobile) AND mousedown (desktop).
  // Previously only mousedown — dropdown never closed on mobile tap-outside.
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setMenuOpenId(null)
        setContextMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  // Close context menu on scroll (it's portal-positioned, so it won't
  // follow the dropdown if the user scrolls the list).
  useEffect(() => {
    if (!menuOpenId) return
    const handler = () => {
      setMenuOpenId(null)
      setContextMenuPos(null)
    }
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [menuOpenId])

  const activeProjects = projects.filter(p => !p.archived)
  const archivedProjects = projects.filter(p => p.archived)

  const handleSwitch = (id) => {
    onSwitch(id)
    setOpen(false)
    setMenuOpenId(null)
    setContextMenuPos(null)
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
    setContextMenuPos(null)
    setOpen(false)
  }

  const handleArchive = (id) => {
    onArchive(id)
    setMenuOpenId(null)
    setContextMenuPos(null)
    setOpen(false)
  }

  const handleUnarchive = (id) => {
    onUnarchive(id)
    setMenuOpenId(null)
    setContextMenuPos(null)
  }

  const handleDeleteConfirm = (id) => {
    setConfirmDeleteId(id)
    setMenuOpenId(null)
    setContextMenuPos(null)
  }

  const handleDeleteFinal = () => {
    onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  // FIX #8: Instead of toggling a menu inside the clipped scroll container,
  // we measure the ••• button's viewport position and pass it down so
  // ProjectRow can call back with real coordinates. The menu is then
  // rendered via a portal at those coordinates — outside any overflow:hidden.
  const toggleMenu = useCallback((e, id, btnRect) => {
    e.stopPropagation()

    if (menuOpenId === id) {
      setMenuOpenId(null)
      setContextMenuPos(null)
      return
    }

    setMenuOpenId(id)

    // FIX #5 + #8: Calculate position in viewport coords.
    // Prefer opening downward; flip upward if not enough space below.
    const menuHeight = 180 // ~44px × 4 items estimated
    const spaceBelow = window.innerHeight - btnRect.bottom
    const openUpward = spaceBelow < menuHeight && btnRect.top > spaceBelow

    // FIX #7: clamp left so menu never exits the right viewport edge.
    const menuWidth = 180
    const rawRight = window.innerWidth - btnRect.right
    const clampedRight = Math.max(8, Math.min(rawRight, window.innerWidth - menuWidth - 8))

    setContextMenuPos({
      right: clampedRight,
      top: openUpward ? undefined : btnRect.bottom + 4,
      bottom: openUpward ? window.innerHeight - btnRect.top + 4 : undefined,
    })
  }, [menuOpenId])

  // The portal-rendered context menu content, shared by active + archived rows.
  const openMenuProject = projects.find(p => p.id === menuOpenId)
  const isOpenMenuArchived = openMenuProject?.archived ?? false

  return (
    <>
      <div className="project-switcher" ref={dropdownRef}>
        {/* Trigger */}
        <button
          className="project-switcher-trigger"
          onClick={() => {
            setOpen(prev => !prev)
            setMenuOpenId(null)
            setContextMenuPos(null)
          }}
          style={{ '--project-color': activeProject?.color || '#2563eb' }}
        >
          <span className="ps-emoji">{activeProject?.emoji || '🚀'}</span>
          <span className="ps-name">{activeProject?.name || 'Select Project'}</span>
          <span className={`ps-chevron ${open ? 'ps-chevron--open' : ''}`}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="ps-dropdown">
            {/* FIX #8: scrollable list — overflow-y:auto here, but context
                menu escapes via portal so it is never clipped */}
            <div className="ps-dropdown-list">
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
                  onToggleMenu={toggleMenu}
                />
              ))}

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
                      onToggleMenu={toggleMenu}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Sticky footer — always visible, never scrolls away */}
            <div className="ps-dropdown-footer">
              <button className="ps-new-btn" onClick={handleCreate}>
                <span className="ps-new-icon">＋</span>
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FIX #8: Context menu rendered via portal — completely outside the
          scroll container, so overflow:hidden can never clip it.
          FIX #5: z-index 300 sits cleanly above the dropdown (200) and
          below the confirm backdrop (500) and full modals (1000). */}
      {menuOpenId && contextMenuPos && openMenuProject &&
        createPortal(
          <div
            className="ps-context-menu ps-context-menu--portal"
            style={{
              position: 'fixed',
              right: contextMenuPos.right,
              top: contextMenuPos.top,
              bottom: contextMenuPos.bottom,
              zIndex: 300,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => {
              setEditingProject(openMenuProject)
              setMenuOpenId(null)
              setContextMenuPos(null)
            }}>✏️ Rename</button>

            <button onClick={() => handleDuplicate(menuOpenId)}>
              📋 Duplicate
            </button>

            {!isOpenMenuArchived && (
              <button onClick={() => handleArchive(menuOpenId)}>
                📦 Archive
              </button>
            )}

            {isOpenMenuArchived && (
              <>
                <button onClick={() => handleUnarchive(menuOpenId)}>
                  ♻️ Restore
                </button>
                <button
                  className="ps-menu-delete"
                  onClick={() => handleDeleteConfirm(menuOpenId)}
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>,
          document.body
        )
      }

      {/* Edit modal */}
      <ProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onSave={handleEditSave}
      />

      {/* Delete confirm — z-index 500/600 in CSS, above everything except full modals */}
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

// ─── Project Row ──────────────────────────────────────────────────────────────
// Simplified — no longer manages its own menu open state or flip logic.
// It just calls onToggleMenu with the button's bounding rect so the parent
// can position the portal-rendered context menu accurately.

function ProjectRow({
  project,
  isActive,
  isArchived,
  menuOpen,
  onSelect,
  onToggleMenu,
}) {
  const menuBtnRef = useRef(null)

  const handleMenuClick = (e) => {
    e.stopPropagation()
    if (menuBtnRef.current) {
      onToggleMenu(e, project.id, menuBtnRef.current.getBoundingClientRect())
    }
  }

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
        className={`ps-row-menu-btn ${menuOpen ? 'ps-row-menu-btn--active' : ''}`}
        onClick={handleMenuClick}
        title="More options"
      >
        •••
      </button>
    </div>
  )
}

export default ProjectSwitcher