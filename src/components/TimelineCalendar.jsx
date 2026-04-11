import { useState } from 'react'
import Calendar from './Calendar'
import NoteModal from './NoteModal'
import ExportButtons from './ExportButtons'
import { ToastContainer, useToast } from './Toast'
import { getMonthsBetween, filterDatesForMonth } from '../utils/dateHelpers'

function TimelineCalendar({ 
  startDateString,
  finishDateString,
  workingDaysArray,
  hoursPerDay = 8,
  dateData = {},
  setDateData,
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllMonths, setShowAllMonths] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const { toasts, showToast, removeToast } = useToast()

  const months = getMonthsBetween(startDateString, finishDateString)

  const completedDates = {}
  Object.entries(dateData).forEach(([date, data]) => {
    if (data?.completed) {
      completedDates[date] = { hours: data.hours ?? hoursPerDay }
    }
  })

  const excludedCount = workingDaysArray.filter(d => d.type === 'excluded').length
  const notesCount = Object.values(dateData).filter(d => d?.note || d?.tasks?.length).length

  // ─── Long-press: mark/unmark a day ───────────────────────────────────────
  const handleDayComplete = (dateString, hours) => {
    setDateData(prev => {
      const existing = prev[dateString] || {}

      if (hours === null) {
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

      showToast(`✓ ${dateString} marked as done`, 'success')
      return {
        ...prev,
        [dateString]: { ...existing, completed: true, hours }
      }
    })
  }

  // ─── Single click: open note modal ───────────────────────────────────────
  const handleDateClick = (dateString) => {
    setSelectedDate(dateString)
    setNoteModalOpen(true)
  }

  // ─── Save note/task/completion from modal ─────────────────────────────────
  // FIX: capture dateKey immediately so it's not affected by
  // selectedDate being cleared when the modal closes.
  const handleSaveNote = (data) => {
    const dateKey = selectedDate // capture now, before modal closes

    setDateData(prev => {
      if (data === null) {
        const existing = prev[dateKey] || {}
        const { note, tasks, timestamp, ...rest } = existing
        const updated = { ...prev }
        if (Object.keys(rest).length === 0) {
          delete updated[dateKey]
        } else {
          updated[dateKey] = rest
        }
        return updated
      }

      return {
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          ...data
        }
      }
    })
  }

  const handleCloseModal = () => {
    setNoteModalOpen(false)
    setSelectedDate(null)
  }

  const remainingMonths = months.slice(1)
  const monthsToShow = showAllMonths ? months : [months[0]]

  return (
    <div className="timeline-calendar">
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
          <ExportButtons workingDays={workingDaysArray} dateNotes={dateData} />

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

          <p className="timeline-hint">
            Click a day for notes · Hold to mark done
          </p>

          <div className="timeline-grid">
            {monthsToShow.map(({ year, month }) => {
              const datesForMonth = filterDatesForMonth(workingDaysArray, year, month)
              const datesWithNotes = datesForMonth.map(item => ({
                ...item,
                hasNote: !!(dateData[item.date]?.note || dateData[item.date]?.tasks?.length)
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

          {remainingMonths.length > 0 && (
            <div className="timeline-expand-section">
              <button
                className="timeline-expand-btn"
                onClick={() => setShowAllMonths(!showAllMonths)}
              >
                {showAllMonths
                  ? <><span>Hide additional months</span><span className="expand-icon">▲</span></>
                  : <><span>Show {remainingMonths.length} more {remainingMonths.length === 1 ? 'month' : 'months'}</span><span className="expand-icon">▼</span></>
                }
              </button>
            </div>
          )}
        </>
      )}

      <NoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseModal}
        dateString={selectedDate}
        existingData={dateData[selectedDate]}
        hoursPerDay={hoursPerDay}
        onSave={handleSaveNote}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}

export default TimelineCalendar