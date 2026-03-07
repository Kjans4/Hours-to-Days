/**
 * TaskItem Component
 * Renders an individual task row with a toggleable completion status and a delete action.
 * * @param {Object} task - The task data { id, text, completed }
 * @param {Function} onToggle - Callback triggered when the checkbox changes
 * @param {Function} onDelete - Callback triggered when the '×' button is clicked
 */
function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="task-item">
      {/* SECTION: Task Content & Toggle
          The label wraps both input and text to increase the clickable area,
          improving mobile accessibility.
      */}
      <label className="task-checkbox-label">
        <input
          type="checkbox"
          checked={task.completed}
          // Lifts state up to the parent component using the task's unique ID
          onChange={() => onToggle(task.id)}
        />
        
        {/* CONDITIONAL STYLING: 
            If task.completed is true, it adds the 'completed' class 
            (usually for a line-through effect in CSS).
        */}
        <span className={task.completed ? 'task-text completed' : 'task-text'}>
          {task.text}
        </span>
      </label>

      {/* SECTION: Delete Action
          The aria-label is crucial here because the button only contains a symbol (×).
          Screen readers will announce "Delete task" instead of "Times".
      */}
      <button
        className="task-delete-btn"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  )
}

export default TaskItem