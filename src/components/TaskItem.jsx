function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="task-item">
      <label className="task-checkbox-label">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
        <span className={task.completed ? 'task-text completed' : 'task-text'}>
          {task.text}
        </span>
      </label>
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