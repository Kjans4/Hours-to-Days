import Calendar from './Calendar'
import { getMonthsBetween, filterDatesForMonth } from '../utils/dateHelpers'

function TimelineCalendar({ 
  startDateString,     // "2026-03-18"
  finishDateString,    // "2026-06-10"
  workingDaysArray     // [{ date: "2026-03-18", type: "start" }, ...]
}) {
  // Get all months between start and finish
  const months = getMonthsBetween(startDateString, finishDateString)

  return (
    <div className="timeline-calendar">
      <h3 className="timeline-title">📅 Project Timeline</h3>
      
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
    </div>
  )
}

export default TimelineCalendar