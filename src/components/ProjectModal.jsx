import { useState, useEffect } from 'react'

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#0f172a', '#475569',
]

const EMOJIS = [
  '🚀', '📱', '🎨', '📊', '🛠️', '📝', '💡', '🎯',
  '🏗️', '🔬', '🎬', '🛒', '📚', '🎮', '🏠', '✈️',
  '💼', '🌐', '🔧', '📈',
]

function ProjectModal({ isOpen, onClose, project = null, onSave }) {
  const isEditing = !!project

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [color, setColor] = useState('#2563eb')

  useEffect(() => {
    if (isOpen) {
      setName(project?.name || '')
      setEmoji(project?.emoji || '🚀')
      setColor(project?.color || '#2563eb')
    }
  }, [isOpen, project])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), emoji, color })
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSave()
  }

  if (!isOpen) return null

  return (
    <div className="project-modal-backdrop" onClick={onClose}>
      <div
        className="project-modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="project-modal-header" style={{ borderTopColor: color }}>
          <h3>{isEditing ? 'Edit Project' : 'New Project'}</h3>
          <button className="project-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="project-modal-body">
          {/* Preview */}
          <div className="project-preview" style={{ background: color }}>
            <span className="project-preview-emoji">{emoji}</span>
            <span className="project-preview-name">{name || 'Project name'}</span>
          </div>

          {/* Name input */}
          <div className="project-field">
            <label>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              maxLength={40}
              autoFocus
              className="project-name-input"
            />
          </div>

          {/* Emoji picker */}
          <div className="project-field">
            <label>Icon</label>
            <div className="emoji-grid">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className={`emoji-btn ${emoji === e ? 'emoji-btn--active' : ''}`}
                  onClick={() => setEmoji(e)}
                  style={emoji === e ? { borderColor: color, background: `${color}18` } : {}}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="project-field">
            <label>Color</label>
            <div className="color-grid">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-btn ${color === c ? 'color-btn--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <span className="color-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="project-modal-footer">
          <button className="project-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="project-modal-save"
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ background: color }}
          >
            {isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectModal