import { useState, useEffect } from 'react'
import TaskItem from './TaskItem'

function NoteModal({ 
  isOpen, 
  onClose, 
  dateString, 
  existingData, 
  onSave 
}) {
  const maxChars = 200

  // State
  const [noteText, setNoteText] = useState('')
  const [tasks, setTasks] = useState([])
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [tasksExpanded, setTasksExpanded] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [showTaskInput, setShowTaskInput] = useState(false)

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && existingData) {
      setNoteText(existingData.note || '')
      setTasks(existingData.tasks || [])
      setNoteExpanded(!!existingData.note)
      setTasksExpanded((existingData.tasks || []).length > 0)
    } else if (isOpen) {
      setNoteText('')
      setTasks([])
      setNoteExpanded(false)
      setTasksExpanded(false)
    }
  }, [isOpen, existingData])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const handleSave = () => {
    const dataToSave = {
      note: noteText.trim() || null,
      tasks: tasks.length > 0 ? tasks : null,
      timestamp: new Date().toISOString()
    }
    
    if (dataToSave.note || dataToSave.tasks) {
      onSave(dataToSave)
    } else {
      onSave(null)
    }
    handleClose()
  }

  const handleClose = () => {
    setNoteText('')
    setTasks([])
    setNewTaskText('')
    setShowTaskInput(false)
    setNoteExpanded(false)
    setTasksExpanded(false)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
  }

  const handleTaskInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTask()
    } else if (e.key === 'Escape') {
      setNewTaskText('')
      setShowTaskInput(false)
    }
  }

  if (!isOpen) return null

  return (
    /* Fix: Wrap modal inside backdrop to enable Flexbox centering */
    <div className="note-modal-backdrop" onClick={handleClose}>
      <div 
        className="note-modal compact" 
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
          {/* Note Section */}
          <div className="modal-section">
            <button
              className="section-toggle"
              onClick={() => setNoteExpanded(!noteExpanded)}
            >
              <span className="toggle-icon">{noteExpanded ? '▼' : '▶'}</span>
              <span className="section-title">Note</span>
            </button>

            {noteExpanded && (
              <div className="section-content">
                <textarea
                  className="note-modal-textarea compact"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, maxChars))}
                  placeholder="Add a note..."
                  maxLength={maxChars}
                  rows={3}
                />
                <div className="note-modal-char-count">
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
              <span className="toggle-icon">{tasksExpanded ? '▼' : '▶'}</span>
              <span className="section-title">Tasks</span>
              {tasks.length > 0 && (
                <span className="task-count">({tasks.length})</span>
              )}
            </button>

            {tasksExpanded && (
              <div className="section-content">
                {tasks.length > 0 && (
                  <div className="task-list">
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
                      className="task-input-save"
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
        <div className="note-modal-footer compact">
          <button 
            className="note-modal-save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteModal