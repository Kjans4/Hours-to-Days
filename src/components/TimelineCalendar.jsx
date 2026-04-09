import { useState } from 'react'
import Calendar from './Calendar'
import NoteModal from './NoteModal'
import ExportButtons from './ExportButtons'
import { getMonthsBetween, filterDatesForMonth } from '../utils/dateHelpers'
import { useHybridStorage } from '../hooks/useHybridStorage'

function TimelineCalendar({ 
  startDateString,
  finishDateString,
  workingDaysArray,
  hoursPerDay = 8,       // passed from result so completed days get the right default
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllMonths, setShowAllMonths] = useState(false)
  
  const months = getMonthsBetween(startDateString, finishDateString)

  // Notes storage (existing)
  const [dateNotes, setDateNotes] = useHybridStorage('dateData', {})

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const excludedCount = workingDaysArray.filter(d => d.type === 'excluded').length
  const notesCount = Object.keys(dateNotes).filter(d => dateNotes[d]?.note || dateNotes[d]?.tasks?.length).length

  // Completed dates derived from dateNotes
  // Shape: { 'YYYY-MM-DD': { hours: number } }
  const completedDates = {}
  Object.entries(dateNotes).forEach(([date, data]) => {
    if (data?.completed) {
      completedDates[date] = { hours: data.hours ?? hoursPerDay }
    }
  })

  /**
   * Called by Calendar when a workday is clicked:
   * - hours = number  → mark/update as complete
   * - hours = null    → unmark (right-click)
   */
  const handleDayComplete = (dateString, hours) => {
    setDateNotes(prev => {
      const existing = prev[dateString] || {}
      if (hours === null) {
        // Uncheck: remove completed flag, keep notes/tasks
        const { completed, hours: _h, ...rest } = existing
        if (Object.keys(rest).length === 0) {
          const updated = { ...prev }
          delete updated[dateString]
          return updated
        }
        return { ...prev, [dateString]: rest }
      }
      // Check or update hours
      return {
        ...prev,
        [dateString]: {
          ...existing,
          completed: true,
          hours
        }
      }
    })
  }

  // Note modal handlers (unchanged)
  const handleDateClick = (dateString) => {
    setSelectedDate(dateString)
    setNoteModalOpen(true)
  }

  const handleSaveNote = (data) => {
    if (data === null) {
      setDateNotes(prev => {
        const existing = prev[selectedDate] || {}
        // Keep completed/hours if present, just remove note/tasks
        const { note, tasks, timestamp, ...rest } = existing
        if (Object.keys(rest).length === 0) {
          const updated = { ...prev }
          delete updated[selectedDate]
          return updated
        }
        return { ...prev, [selectedDate]: rest }
      })
    } else {
      setDateNotes(prev => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          ...data
        }
      }))
    }
  }

  const handleCloseModal = () => {
    setNoteModalOpen(false)
    setSelectedDate(null)
  }

  const firstMonth = months[0]
  const remainingMonths = months.slice(1)
  const monthsToShow = showAllMonths ? months : [firstMonth]

  const completedCount = Object.keys(completedDates).length

  return (
    <div className="timeline-calendar">
      {/* Toggle Header */}
      <button 
        className="timeline-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="timeline-toggle-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="timeline-title">📅 Project Timeline</span>
        <span className="timeline-months-count">
          ({months.length} {months.length === 1 ? 'month' : 'months'})
        </span>
      </button>

      {isExpanded && (
        <>
          <ExportButtons 
            workingDays={workingDaysArray} 
            dateNotes={dateNotes} 
          />

          {/* Legend */}
          <div className="timeline-legend">
            <span className="legend-item">
              <span className="legend-color start"></span> Start
            </span>
            <span className="legend-item">
              <span className="legend-color workday"></span> Working
            </span>
            <span className="legend-item">
              <span className="legend-color finish"></span> Finish
            </span>
            <span className="legend-item">
              <span className="legend-color completed-legend"></span> Done
            </span>
            {excludedCount > 0 && (
              <span className="legend-item">
                <span className="legend-color excluded"></span> Excluded ({excludedCount})
              </span>
            )}
            {Object.values(dateNotes).some(d => d?.note || d?.tasks?.length) && (
              <span className="legend-item">
                <span className="legend-note-icon">💬</span> Note ({notesCount})
              </span>
            )}
          </div>

          {/* Hint text */}
          <p className="timeline-hint">
            Click a working day to mark it done · Right-click a completed day to uncheck
          </p>

          {/* Calendar Grid */}
          <div className="timeline-grid">
            {monthsToShow.map(({ year, month }) => {
              const datesForMonth = filterDatesForMonth(workingDaysArray, year, month)
              
              const datesWithNotes = datesForMonth.map(item => ({
                ...item,
                hasNote: !!(dateNotes[item.date]?.note || dateNotes[item.date]?.tasks?.length)
              }))

              return (
                <Calendar
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  highlightedDates={datesWithNotes}
                  completedDates={completedDates}
                  onDayClick={handleDateClick}
                  onDayComplete={handleDayComplete}
                  hoursPerDay={hoursPerDay}
                  showNavigation={false}
                />
              )
            })}
          </div>

          {/* Show More/Less Button */}
          {remainingMonths.length > 0 && (
            <div className="timeline-expand-section">
              <button
                className="timeline-expand-btn"
                onClick={() => setShowAllMonths(!showAllMonths)}
              >
                {showAllMonths ? (
                  <>
                    <span>Hide additional months</span>
                    <span className="expand-icon">▲</span>
                  </>
                ) : (
                  <>
                    <span>Show {remainingMonths.length} more {remainingMonths.length === 1 ? 'month' : 'months'}</span>
                    <span className="expand-icon">▼</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <NoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseModal}
        dateString={selectedDate}
        existingData={dateNotes[selectedDate]}
        onSave={handleSaveNote}
      />
    </div>
  )
}

export default TimelineCalendar