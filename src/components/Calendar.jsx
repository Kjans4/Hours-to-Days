import { useState, useRef } from 'react'
import { getMonthName } from '../utils/dateHelpers'

const LONG_PRESS_MS = 500

/**
 * Calendar Component
 * - Single click on any day → onDayClick (opens note modal)
 * - Long-press on a workday → onDayComplete (quick check/uncheck)
 */
function Calendar({ 
  year, 
  month, 
  highlightedDates = [],
  completedDates = {},
  onDayClick = null,
  onDayComplete = null,
  hoursPerDay = 8,
  showNavigation = false,
  onPrevMonth,
  onNextMonth
}) {
  const longPressTimer = useRef(null)
  const didLongPress = useRef(false)

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  // O(1) highlight lookup
  const highlightMap = {}
  highlightedDates.forEach(item => {
    highlightMap[item.date] = { type: item.type, hasNote: item.hasNote || false }
  })

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const isFutureDate = (day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(year, month, day) > today
  }

  const getDateString = (day) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  // ─── Long-press handlers ─────────────────────────────────────────────────

  const handlePressStart = (day, dateString, highlightType) => {
    didLongPress.current = false
    const isWorkday = ['start', 'workday', 'finish'].includes(highlightType)
    if (!isWorkday || !onDayComplete) return

    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true

      if (isFutureDate(day)) {
        const ok = window.confirm(`${dateString} is a future date. Mark it as completed anyway?`)
        if (!ok) return
      }

      const isCompleted = !!completedDates[dateString]
      onDayComplete(dateString, isCompleted ? null : hoursPerDay)
    }, LONG_PRESS_MS)
  }

  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  const handleClick = (dateString) => {
    // Swallow click if this interaction was a long-press
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    if (onDayClick) onDayClick(dateString)
  }

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderEmptyCells = () =>
    Array.from({ length: firstDay }, (_, i) => (
      <div key={`empty-${i}`} className="calendar-day empty" />
    ))

  const renderDays = () => {
    const days = []
    for (let day = 1; day <= lastDate; day++) {
      const dateString = getDateString(day)
      const dateData = highlightMap[dateString]
      const highlightType = dateData?.type
      const hasNote = dateData?.hasNote
      const isCompleted = !!completedDates[dateString]
      const completedHours = completedDates[dateString]?.hours

      let className = 'calendar-day'
      if (highlightType) className += ` ${highlightType}`
      if (isCompleted)   className += ' completed'
      if (hasNote)       className += ' has-note'
      if (isToday(day))  className += ' today'
      if (onDayClick)    className += ' clickable'

      days.push(
        <div
          key={day}
          className={className}
          onClick={() => handleClick(dateString)}
          onMouseDown={() => handlePressStart(day, dateString, highlightType)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => handlePressStart(day, dateString, highlightType)}
          onTouchEnd={handlePressEnd}
          title="Click for notes · Hold to mark done"
        >
          <span>{day}</span>

          {/* Hours badge shown on completed days */}
          {isCompleted && completedHours != null && (
            <span className="day-hours-badge">{completedHours}h</span>
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
        <h3 className="calendar-month-year">{getMonthName(month)} {year}</h3>
        {showNavigation && (
          <button onClick={onNextMonth} className="calendar-nav-btn">▶</button>
        )}
      </div>

      <div className="calendar-weekdays">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="calendar-days">
        {renderEmptyCells()}
        {renderDays()}
      </div>
    </div>
  )
}

export default Calendar