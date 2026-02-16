import { useState } from 'react'
import Calendar from './Calendar'
import { getMonthsBetween, filterDatesForMonth } from '../utils/dateHelpers'

function TimelineCalendar({ 
  startDateString,
  finishDateString,
  workingDaysArray
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const months = getMonthsBetween(startDateString, finishDateString)

  return (
    <div className="timeline-calendar">
      {/* Collapse/Expand Button */}
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

      {/* Collapsible Content */}
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
          </div>

          {/* Calendar Grid */}
          <div className="timeline-grid">
            {months.map(({ year, month }) => {
              const datesForMonth = filterDatesForMonth(workingDaysArray, year, month)
              
              return (
                <Calendar
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  highlightedDates={datesForMonth}
                  onDayClick={null}
                  showNavigation={false}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default TimelineCalendar