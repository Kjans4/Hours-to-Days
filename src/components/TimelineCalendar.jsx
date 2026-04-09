import { useState } from 'react'
import Calendar from './Calendar'
import NoteModal from './NoteModal'
import ExportButtons from './ExportButtons'
import { ToastContainer, useToast } from './Toast'
import { getMonthsBetween, filterDatesForMonth, formatDateForDisplay } from '../utils/dateHelpers'
import { useHybridStorage } from '../hooks/useHybridStorage'

function TimelineCalendar({ 
  startDateString,
  finishDateString,
  workingDaysArray,
  hoursPerDay = 8,
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllMonths, setShowAllMonths] = useState(false)

  const months = getMonthsBetween(startDateString, finishDateString)

  const [dateNotes, setDateNotes] = useHybridStorage('dateData', {})

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  // Toast
  const { toasts, showToast, removeToast } = useToast()

  // Derive completedDates from dateNotes
  const completedDates = {}
  Object.entries(dateNotes).forEach(([date, data]) => {
    if (data?.completed) {
      completedDates[date] = { hours: data.hours ?? hoursPerDay }
    }
  })

  const excludedCount = workingDaysArray.filter(d => d.type === 'excluded').length
  const notesCount = Object.values(dateNotes).filter(d => d?.note || d?.tasks?.length).length

  /**
   * Long-press handler from Calendar:
   * hours = number → mark complete
   * hours = null   → unmark
   */
  const handleDayComplete = (dateString, hours) => {
    setDateNotes(prev => {
      const existing = prev[dateString] || {}

      if (hours === null) {
        // Unmark: strip completed/hours, keep note/tasks
        const { completed, hours: _h, ...rest } = existing
        const updated = { ...prev }
        if (Object.keys(rest).length === 0) {
          delete updated[dateString]
        } else {
          updated[dateString] = rest
        }
        showToast(`${dateString} unmarked`, 'warning')
        return updated
      }

      // Mark complete
      showToast(`✓ ${dateString} marked as done`, 'success')
      return {
        ...prev,
        [dateString]: { ...existing, completed: true, hours }
      }
    })
  }

  // Single click → open note modal (restored original behavior)
  const handleDateClick = (dateString) => {
    setSelectedDate(dateString)
    setNoteModalOpen(true)
  }

  // Save from note modal — merges completed state with notes/tasks
  const handleSaveNote = (data) => {
    if (data === null) {
      setDateNotes(prev => {
        const existing = prev[selectedDate] || {}
        const { note, tasks, timestamp, ...rest } = existing
        const updated = { ...prev }
        if (Object.keys(rest).length === 0) {
          delete updated[selectedDate]
        } else {
          updated[selectedDate] = rest
        }
        return updated
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

  return (
    <div className="timeline-calendar">
      {/* Toggle Header */}
      <button 
        className="timeline-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="timeline-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="timeline-title">📅 Project Timeline</span>
        <span className="timeline-months-count">
          ({months.length} {months.length === 1 ? 'month' : 'months'})
        </span>
      </button>

      {isExpanded && (
        <>
          <ExportButtons workingDays={workingDaysArray} dateNotes={dateNotes} />

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
            {notesCount > 0 && (
              <span className="legend-item">
                <span className="legend-note-icon">💬</span> Note ({notesCount})
              </span>
            )}
          </div>

          {/* Hint */}
          <p className="timeline-hint">
            Click a day to add notes · Hold (long-press) to mark done
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

          {/* Show More/Less */}
          {remainingMonths.length > 0 && (
            <div className="timeline-expand-section">
              <button
                className="timeline-expand-btn"
                onClick={() => setShowAllMonths(!showAllMonths)}
              >
                {showAllMonths ? (
                  <><span>Hide additional months</span><span className="expand-icon">▲</span></>
                ) : (
                  <><span>Show {remainingMonths.length} more {remainingMonths.length === 1 ? 'month' : 'months'}</span><span className="expand-icon">▼</span></>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseModal}
        dateString={selectedDate}
        existingData={dateNotes[selectedDate]}
        hoursPerDay={hoursPerDay}
        onSave={handleSaveNote}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}

export default TimelineCalendar