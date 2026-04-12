import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ProjectModal from './ProjectModal'

/**
 * Z-INDEX SCALE (matches all modals across the app)
 *
 *  100  — sticky header / sub-nav
 *  200  — dropdown panel
 *  300  — context menu (portal-rendered)
 *  400  — bottom nav (mobile)
 *  500  — confirm backdrop
 *  600  — confirm dialog
 * 1000  — full modals (auth, note)
 * 2000  — toasts
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
  const [contextMenuPos, setContextMenuPos] = useState(null)

  // FIX #12: track focused row index for arrow key navigation
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const rowRefs = useRef([])

  // FIX #4: listen on touchstart (mobile) AND mousedown (desktop)
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeAll()
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  // Close context menu when user scrolls the list
  useEffect(() => {
    if (!menuOpenId) return
    const handler = () => {
      setMenuOpenId(null)
      setContextMenuPos(null)
    }
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [menuOpenId])

  // FIX #12: move focus to the newly focused row whenever focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && rowRefs.current[focusedIndex]) {
      rowRefs.current[focusedIndex].focus()
    }
  }, [focusedIndex])

  const closeAll = () => {
    setOpen(false)
    setMenuOpenId(null)
    setContextMenuPos(null)
    setFocusedIndex(-1)
  }

  const activeProjects = projects.filter(p => !p.archived)
  const archivedProjects = projects.filter(p => p.archived)

  // All rows visible in the list (active + expanded archived)
  const visibleRows = showArchived
    ? [...activeProjects, ...archivedProjects]
    : activeProjects

  const handleSwitch = (id) => {
    onSwitch(id)
    closeAll()
    triggerRef.current?.focus()
  }

  const handleCreate = () => {
    onCreate()
    closeAll()
  }

  const handleEditSave = ({ name, emoji, color }) => {
    if (editingProject) onUpdate(editingProject.id, { name, emoji, color })
    setEditingProject(null)
  }

  const handleDuplicate = (id) => {
    onDuplicate(id)
    closeAll()
  }

  const handleArchive = (id) => {
    onArchive(id)
    closeAll()
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

  const toggleMenu = useCallback((e, id, btnRect) => {
    e.stopPropagation()

    if (menuOpenId === id) {
      setMenuOpenId(null)
      setContextMenuPos(null)
      return
    }

    setMenuOpenId(id)

    const menuHeight = 180
    const spaceBelow = window.innerHeight - btnRect.bottom
    const openUpward = spaceBelow < menuHeight && btnRect.top > spaceBelow

    const menuWidth = 180
    const rawRight = window.innerWidth - btnRect.right
    const clampedRight = Math.max(8, Math.min(rawRight, window.innerWidth - menuWidth - 8))

    setContextMenuPos({
      right: clampedRight,
      top: openUpward ? undefined : btnRect.bottom + 4,
      bottom: openUpward ? window.innerHeight - btnRect.top + 4 : undefined,
    })
  }, [menuOpenId])

  // FIX #12: keyboard handler on the dropdown container
  const handleDropdownKeyDown = (e) => {
    if (!open) return

    switch (e.key) {
      case 'Escape':
        // Close everything and return focus to trigger
        e.preventDefault()
        closeAll()
        triggerRef.current?.focus()
        break

      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < visibleRows.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : visibleRows.length - 1
        )
        break

      case 'Enter':
      case ' ':
        // Select the focused row if it's not archived
        if (focusedIndex >= 0) {
          const row = visibleRows[focusedIndex]
          if (row && !row.archived) {
            e.preventDefault()
            handleSwitch(row.id)
          }
        }
        break

      case 'Tab':
        // Tab out — close the dropdown
        closeAll()
        break

      default:
        break
    }
  }

  const openMenuProject = projects.find(p => p.id === menuOpenId)
  const isOpenMenuArchived = openMenuProject?.archived ?? false

  return (
    <>
      <div
        className="project-switcher"
        ref={dropdownRef}
        onKeyDown={handleDropdownKeyDown}
      >
        {/* Trigger */}
        <button
          ref={triggerRef}
          className="project-switcher-trigger"
          onClick={() => {
            setOpen(prev => {
              if (prev) closeAll()
              return !prev
            })
            setMenuOpenId(null)
            setContextMenuPos(null)
          }}
          // FIX #12: aria-expanded tells screen readers whether the list is open
          aria-expanded={open}
          aria-haspopup="listbox"
          style={{ '--project-color': activeProject?.color || '#2563eb' }}
        >
          <span className="ps-emoji">{activeProject?.emoji || '🚀'}</span>
          <span className="ps-name">{activeProject?.name || 'Select Project'}</span>
          <span className={`ps-chevron ${open ? 'ps-chevron--open' : ''}`}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          // FIX #12: role="listbox" so screen readers treat this as a selector
          <div className="ps-dropdown" role="listbox" aria-label="Projects">
            {/* Scrollable list — context menu escapes via portal */}
            <div className="ps-dropdown-list">
              <div className="ps-section-label">Active</div>

              {activeProjects.length === 0 && (
                <p className="ps-empty">No active projects</p>
              )}

              {activeProjects.map((p, i) => (
                <ProjectRow
                  key={p.id}
                  ref={el => rowRefs.current[i] = el}
                  project={p}
                  isActive={p.id === activeProject?.id}
                  menuOpen={menuOpenId === p.id}
                  isFocused={focusedIndex === i}
                  onSelect={() => handleSwitch(p.id)}
                  onToggleMenu={toggleMenu}
                  onFocus={() => setFocusedIndex(i)}
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

                  {showArchived && archivedProjects.map((p, i) => {
                    const rowIndex = activeProjects.length + i
                    return (
                      <ProjectRow
                        key={p.id}
                        ref={el => rowRefs.current[rowIndex] = el}
                        project={p}
                        isActive={false}
                        isArchived={true}
                        menuOpen={menuOpenId === p.id}
                        isFocused={focusedIndex === rowIndex}
                        // FIX #9: archived rows pass a no-op but show a
                        // tooltip explaining they must be restored first
                        onSelect={() => {}}
                        onToggleMenu={toggleMenu}
                        onFocus={() => setFocusedIndex(rowIndex)}
                      />
                    )
                  })}
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

      {/* Context menu — portal-rendered, never clipped by overflow */}
      {menuOpenId && contextMenuPos && openMenuProject &&
        createPortal(
          <div
            className="ps-context-menu"
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

// ─── Project Row ──────────────────────────────────────────────────────────────
// Uses forwardRef so the parent can focus rows programmatically for
// keyboard navigation (Bug #12).

import { forwardRef } from 'react'

const ProjectRow = forwardRef(function ProjectRow({
  project,
  isActive,
  isArchived,
  menuOpen,
  isFocused,
  onSelect,
  onToggleMenu,
  onFocus,
}, ref) {
  const menuBtnRef = useRef(null)

  const handleMenuClick = (e) => {
    e.stopPropagation()
    if (menuBtnRef.current) {
      onToggleMenu(e, project.id, menuBtnRef.current.getBoundingClientRect())
    }
  }

  const handleClick = () => {
    if (isArchived) return
    onSelect()
  }

  return (
    <div
      ref={ref}
      className={[
        'ps-row',
        isActive   ? 'ps-row--active'   : '',
        isArchived ? 'ps-row--archived' : '',
        isFocused  ? 'ps-row--focused'  : '',
      ].filter(Boolean).join(' ')}
      // FIX #12: tabIndex makes rows focusable via keyboard
      tabIndex={0}
      role="option"
      aria-selected={isActive}
      onClick={handleClick}
      onFocus={onFocus}
      onKeyDown={(e) => {
        // Enter/Space on a row selects it (if not archived)
        if ((e.key === 'Enter' || e.key === ' ') && !isArchived) {
          e.preventDefault()
          onSelect()
        }
      }}
      style={isActive ? { borderLeftColor: project.color } : {}}
      // FIX #9: archived rows show a tooltip explaining they are not selectable.
      // Users who tap an archived row get immediate feedback instead of silence.
      title={isArchived ? 'Restore this project first to switch to it' : undefined}
    >
      <span className="ps-row-emoji">{project.emoji}</span>
      <span className="ps-row-name">{project.name}</span>

      {isActive && (
        <span className="ps-row-check" style={{ color: project.color }}>✓</span>
      )}

      {/* FIX #9: archived badge — makes it instantly clear the row is inactive */}
      {isArchived && (
        <span className="ps-row-archived-badge">archived</span>
      )}

      <button
        ref={menuBtnRef}
        className={`ps-row-menu-btn ${menuOpen ? 'ps-row-menu-btn--active' : ''}`}
        onClick={handleMenuClick}
        // Stop Enter/Space on the ••• button from bubbling to the row's keydown
        onKeyDown={e => e.stopPropagation()}
        title="More options"
        aria-label={`More options for ${project.name}`}
      >
        •••
      </button>
    </div>
  )
})

export default ProjectSwitcher