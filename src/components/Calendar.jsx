import { useState } from 'react'
import { getMonthName } from '../utils/dateHelpers'

/**
 * Calendar Component
 * Renders a monthly calendar grid with support for highlighting specific dates,
 * navigation, click interactions, and day completion with inline hour editing.
 */
function Calendar({ 
  year, 
  month, 
  highlightedDates = [], // Array of { date: 'YYYY-MM-DD', type: string, hasNote: bool }
  completedDates = {},   // Map of { 'YYYY-MM-DD': { hours: number } }
  onDayClick = null,     // Callback when a non-completed workday is clicked
  onDayComplete = null,  // Callback(dateString, hours) when a day is checked/unchecked
  hoursPerDay = 8,       // Default hours to assign when a day is checked
  showNavigation = false,
  onPrevMonth,
  onNextMonth
}) {
  // Tracks which completed day is currently in "edit hours" mode
  const [editingDate, setEditingDate] = useState(null)
  const [editHoursValue, setEditHoursValue] = useState('')

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  
  // O(1) lookup map for highlighted dates
  const highlightMap = {}
  highlightedDates.forEach(item => {
    highlightMap[item.date] = {
      type: item.type,
      hasNote: item.hasNote || false 
    }
  })
  
  const isToday = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isFutureDate = (day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(year, month, day)
    return target > today
  }
  
  const getDateString = (day) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
  }

  /**
   * Handles a click on a calendar day:
   * - If not a workday: delegates to onDayClick (note modal)
   * - If a workday and NOT completed: marks it complete
   * - If a workday and IS completed: enters inline edit mode for hours
   */
  const handleDayClick = (day, dateString, highlightType) => {
    const isWorkday = ['start', 'workday', 'finish'].includes(highlightType)
    const isCompleted = !!completedDates[dateString]

    if (!isWorkday) {
      // Non-workday — open note modal as before
      if (onDayClick) onDayClick(dateString)
      return
    }

    if (isCompleted) {
      // Second click on completed day → enter edit mode
      if (editingDate === dateString) {
        // Already editing this date, clicking again closes it
        setEditingDate(null)
        setEditHoursValue('')
      } else {
        setEditingDate(dateString)
        setEditHoursValue(String(completedDates[dateString].hours))
      }
      return
    }

    // First click: mark as complete
    if (isFutureDate(day)) {
      const confirmed = window.confirm(
        `${dateString} is a future date. Mark it as completed anyway?`
      )
      if (!confirmed) return
    }

    if (onDayComplete) {
      onDayComplete(dateString, hoursPerDay)
    }
  }

  /**
   * Confirms an hours edit — validates input and calls onDayComplete with new value
   */
  const handleHoursConfirm = (dateString) => {
    const parsed = parseFloat(editHoursValue)
    if (!isNaN(parsed) && parsed > 0) {
      if (onDayComplete) {
        onDayComplete(dateString, parsed)
      }
    }
    setEditingDate(null)
    setEditHoursValue('')
  }

  /**
   * Unmarks a completed day (right-click or dedicated gesture)
   * We expose this via a long-press / context menu alternative:
   * holding Shift and clicking a completed day will uncheck it.
   */
  const handleDayContextMenu = (e, dateString, highlightType) => {
    const isWorkday = ['start', 'workday', 'finish'].includes(highlightType)
    const isCompleted = !!completedDates[dateString]
    if (isWorkday && isCompleted) {
      e.preventDefault()
      if (onDayComplete) {
        onDayComplete(dateString, null) // null = uncheck
      }
      setEditingDate(null)
    }
  }

  const renderEmptyCells = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    return cells
  }
  
  const renderDays = () => {
    const days = []
    for (let day = 1; day <= lastDate; day++) {
      const dateString = getDateString(day)
      const dateData = highlightMap[dateString]
      const highlightType = dateData?.type
      const hasNote = dateData?.hasNote
      const isCompleted = !!completedDates[dateString]
      const isEditing = editingDate === dateString
      const completedHours = completedDates[dateString]?.hours

      let className = 'calendar-day'
      if (highlightType) className += ` ${highlightType}`
      if (isCompleted) className += ' completed'
      if (hasNote) className += ' has-note'
      if (isToday(day)) className += ' today'
      if (onDayClick || highlightType) className += ' clickable'

      days.push(
        <div
          key={day}
          className={className}
          onClick={() => handleDayClick(day, dateString, highlightType)}
          onContextMenu={(e) => handleDayContextMenu(e, dateString, highlightType)}
          title={isCompleted ? 'Click to edit hours · Right-click to uncheck' : ''}
        >
          <span>{day}</span>

          {/* Hours badge shown on completed days */}
          {isCompleted && !isEditing && (
            <span className="day-hours-badge">{completedHours}h</span>
          )}

          {/* Inline hours edit input (shown on second click) */}
          {isEditing && (
            <input
              className="day-hours-input"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={editHoursValue}
              onChange={(e) => setEditHoursValue(e.target.value)}
              onBlur={() => handleHoursConfirm(dateString)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleHoursConfirm(dateString)
                if (e.key === 'Escape') {
                  setEditingDate(null)
                  setEditHoursValue('')
                }
              }}
              onClick={(e) => e.stopPropagation()} // prevent triggering day click
              autoFocus
            />
          )}
        </div>
      )
    }
    return days
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        {showNavigation && (
          <button onClick={onPrevMonth} className="calendar-nav-btn">◀</button>
        )}
        <h3 className="calendar-month-year">
          {getMonthName(month)} {year}
        </h3>
        {showNavigation && (
          <button onClick={onNextMonth} className="calendar-nav-btn">▶</button>
        )}
      </div>

      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-days">
        {renderEmptyCells()}
        {renderDays()}
      </div>
    </div>
  )
}

export default Calendar