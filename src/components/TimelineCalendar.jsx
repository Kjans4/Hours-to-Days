import { useState } from 'react'
import Calendar from './Calendar'
import NoteModal from './NoteModal'
import { getMonthsBetween, filterDatesForMonth } from '../utils/dateHelpers'
import { useLocalStorage } from '../hooks/useLocalStorage'

function TimelineCalendar({ 
  startDateString,
  finishDateString,
  workingDaysArray
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const months = getMonthsBetween(startDateString, finishDateString)

  // Note state
  const [dateNotes, setDateNotes] = useLocalStorage('dateNotes', {})
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  // Count excluded and notes
  const excludedCount = workingDaysArray.filter(d => d.type === 'excluded').length
  const notesCount = Object.keys(dateNotes).length

  // Handle date click
  const handleDateClick = (dateString) => {
    setSelectedDate(dateString)
    setNoteModalOpen(true)
  }

  // Save note
  const handleSaveNote = (noteText) => {
    setDateNotes(prev => ({
      ...prev,
      [selectedDate]: {
        text: noteText,
        timestamp: new Date().toISOString()
      }
    }))
  }

  // Delete note
  const handleDeleteNote = () => {
    setDateNotes(prev => {
      const updated = { ...prev }
      delete updated[selectedDate]
      return updated
    })
  }

  // Close modal
  const handleCloseModal = () => {
    setNoteModalOpen(false)
    setSelectedDate(null)
  }

  return (
    <div className="timeline-calendar">
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
          {/* Legend */}
          <div className="timeline-legend">
            <span className="legend-item">
              <span className="legend-color start"></span> Start Date
            </span>
            <span className="legend-item">
              <span className="legend-color workday"></span> Working Days
            </span>
            <span className="legend-item">
              <span className="legend-color finish"></span> Finish Date
            </span>
            {excludedCount > 0 && (
              <span className="legend-item">
                <span className="legend-color excluded"></span> Excluded ({excludedCount})
              </span>
            )}
            {notesCount > 0 && (
              <span className="legend-item">
                <span className="legend-note-icon">💬</span> Has Note ({notesCount})
              </span>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="timeline-grid">
            {months.map(({ year, month }) => {
              const datesForMonth = filterDatesForMonth(workingDaysArray, year, month)
              
              // Add note indicator to dates
              const datesWithNotes = datesForMonth.map(item => {
                const hasNote = dateNotes[item.date]
                return {
                  ...item,
                  hasNote: !!hasNote
                }
              })

              return (
                <Calendar
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  highlightedDates={datesWithNotes}
                  onDayClick={handleDateClick}
                  showNavigation={false}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseModal}
        dateString={selectedDate}
        existingNote={dateNotes[selectedDate]}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  )
}

export default TimelineCalendar