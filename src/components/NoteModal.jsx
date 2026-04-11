import { useState, useEffect, useRef } from 'react'
import TaskItem from './TaskItem'

function NoteModal({ 
  isOpen, 
  onClose, 
  dateString, 
  existingData,
  hoursPerDay = 8,
  onSave 
}) {
  const maxChars = 200

  const [noteText, setNoteText] = useState('')
  const [tasks, setTasks] = useState([])
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [tasksExpanded, setTasksExpanded] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [showTaskInput, setShowTaskInput] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedHours, setCompletedHours] = useState('')

  /**
   * FIX: track whether the modal is already initialized for the current open session.
   * We only load from existingData when the modal transitions from closed → open.
   * Subsequent re-renders that change existingData (e.g. Firebase sync completing
   * mid-edit) do NOT reset the user's in-progress edits.
   */
  const initializedRef = useRef(false)

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      // Modal just opened — load existing data once
      initializedRef.current = true

      if (existingData) {
        setNoteText(existingData.note || '')
        setTasks(existingData.tasks || [])
        setNoteExpanded(!!existingData.note)
        setTasksExpanded((existingData.tasks || []).length > 0)
        setIsCompleted(!!existingData.completed)
        setCompletedHours(
          existingData.hours != null
            ? String(existingData.hours)
            : String(hoursPerDay)
        )
      } else {
        setNoteText('')
        setTasks([])
        setNoteExpanded(false)
        setTasksExpanded(false)
        setShowTaskInput(false)
        setIsCompleted(false)
        setCompletedHours(String(hoursPerDay))
      }
    }

    if (!isOpen) {
      // Modal closed — reset the guard for next open
      initializedRef.current = false
    }
  }, [isOpen]) // ← only depends on isOpen, NOT existingData or hoursPerDay

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleToggleComplete = () => {
    const next = !isCompleted
    setIsCompleted(next)
    if (next && !completedHours) {
      setCompletedHours(String(hoursPerDay))
    }
  }

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: newTaskText.trim(),
        completed: false
      }
      setTasks(prev => [...prev, newTask])
      setNewTaskText('')
      setShowTaskInput(false)
    }
  }

  const handleToggleTask = (taskId) => {
    setTasks(prev =>
      prev.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task)
    )
  }

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const handleSave = () => {
    const parsedHours = parseFloat(completedHours)

    const dataToSave = {
      note: noteText.trim() || null,
      tasks: tasks.length > 0 ? tasks : null,
      completed: isCompleted || null,
      hours: isCompleted && !isNaN(parsedHours) ? parsedHours : null,
      timestamp: new Date().toISOString()
    }

    const hasContent = dataToSave.note || dataToSave.tasks || dataToSave.completed
    onSave(hasContent ? dataToSave : null)
    handleClose()
  }

  const handleClose = () => {
    setNoteText('')
    setTasks([])
    setNewTaskText('')
    setShowTaskInput(false)
    setNoteExpanded(false)
    setTasksExpanded(false)
    setIsCompleted(false)
    setCompletedHours('')
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
  }

  const handleTaskInputKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTask() }
    if (e.key === 'Escape') { setNewTaskText(''); setShowTaskInput(false) }
  }

  if (!isOpen) return null

  return (
    <div className="note-modal" onClick={handleClose}>
      <div 
        className="note-modal-content"
        onClick={(e) => e.stopPropagation()} 
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="note-modal-header">
          <h3>{formatDate(dateString)}</h3>
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

          {/* Mark as Done toggle */}
          <div className={`done-toggle-section ${isCompleted ? 'done-toggle-section--active' : ''}`}>
            <div className="done-toggle-left">
              <span className="done-toggle-icon">{isCompleted ? '✅' : '⬜'}</span>
              <div className="done-toggle-text">
                <span className="done-toggle-label">
                  {isCompleted ? 'Marked as Done' : 'Mark as Done'}
                </span>
                {isCompleted && (
                  <span className="done-toggle-sub">Hold calendar day to quick-toggle</span>
                )}
              </div>
            </div>

            <div className="done-toggle-right">
              {isCompleted && (
                <div className="done-hours-input-wrap">
                  <input
                    type="number"
                    className="done-hours-input"
                    value={completedHours}
                    onChange={(e) => setCompletedHours(e.target.value)}
                    min="0.5"
                    max="24"
                    step="0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="done-hours-unit">hrs</span>
                </div>
              )}
              <button
                className={`done-toggle-btn ${isCompleted ? 'done-toggle-btn--active' : ''}`}
                onClick={handleToggleComplete}
              >
                {isCompleted ? 'Unmark' : 'Mark Done'}
              </button>
            </div>
          </div>

          {/* Note Section */}
          <div className="modal-section">
            <button
              className="section-toggle"
              onClick={() => setNoteExpanded(!noteExpanded)}
            >
              <span>{noteExpanded ? '▼' : '▶'} Note</span>
            </button>
            {noteExpanded && (
              <div className="section-content">
                <textarea
                  className="note-modal-textarea"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, maxChars))}
                  placeholder="Add a note..."
                  maxLength={maxChars}
                />
                <div className={`char-counter ${noteText.length > maxChars * 0.9 ? 'warning' : ''}`}>
                  {noteText.length}/{maxChars}
                </div>
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="modal-section">
            <button
              className="section-toggle"
              onClick={() => setTasksExpanded(!tasksExpanded)}
            >
              <span>
                {tasksExpanded ? '▼' : '▶'} Tasks
                {tasks.length > 0 && ` (${tasks.length})`}
              </span>
            </button>
            {tasksExpanded && (
              <div className="section-content">
                {tasks.length > 0 && (
                  <div className="tasks-list">
                    {tasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}
                {showTaskInput ? (
                  <div className="task-input-wrapper">
                    <input
                      type="text"
                      className="task-input"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={handleTaskInputKeyDown}
                      placeholder="Task name..."
                      autoFocus
                    />
                    <button
                      className="add-task-btn"
                      onClick={handleAddTask}
                      disabled={!newTaskText.trim()}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    className="add-task-btn"
                    onClick={() => setShowTaskInput(true)}
                  >
                    + Add Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="note-modal-footer">
          <button className="note-modal-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteModal