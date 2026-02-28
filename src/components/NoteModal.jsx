import { useState, useEffect } from 'react'

function NoteModal({ 
  isOpen, 
  onClose, 
  dateString, 
  existingNote, 
  onSave, 
  onDelete 
}) {
  const [noteText, setNoteText] = useState('')
  const maxChars = 200

  useEffect(() => {
    if (isOpen && existingNote) {
      setNoteText(existingNote.text || '')
    } else if (isOpen && !existingNote) {
      setNoteText('')
    }
  }, [isOpen, existingNote])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim())
    }
    handleClose()
  }

  const handleDelete = () => {
    if (window.confirm('Delete this note?')) {
      onDelete()
      handleClose()
    }
  }

  const handleClose = () => {
    setNoteText('')
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="note-modal-backdrop" onClick={handleClose}></div>

      {/* Modal */}
      <div className="note-modal" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="note-modal-header">
          <h3>{existingNote ? 'Edit Note' : 'Add Note'}</h3>
          <button 
            className="note-modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="note-modal-body">
          <p className="note-modal-date">
            {formatDate(dateString)}
          </p>

          <label htmlFor="note-textarea" className="note-modal-label">
            Note:
          </label>

          <textarea
            id="note-textarea"
            className="note-modal-textarea"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value.slice(0, maxChars))}
            placeholder="Add a note for this date..."
            maxLength={maxChars}
            rows={4}
            autoFocus
          />

          <div className="note-modal-char-count">
            {noteText.length} / {maxChars} characters
          </div>
        </div>

        {/* Footer */}
        <div className="note-modal-footer">
          {existingNote && (
            <button 
              className="note-modal-delete"
              onClick={handleDelete}
            >
              Delete Note
            </button>
          )}
          <div className="note-modal-actions">
            <button 
              className="note-modal-cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className="note-modal-save"
              onClick={handleSave}
              disabled={!noteText.trim()}
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NoteModal