import { getMonthName } from '../utils/dateHelpers'

function Calendar({ 
  year, 
  month, 
  highlightedDates = [],  // [{ date: "2026-03-18", type: "start" }]
  onDayClick = null,      // Function or null for read-only
  showNavigation = false,
  onPrevMonth,
  onNextMonth
}) {
  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDay = new Date(year, month, 1).getDay()
  
  // Get last date of month
  const lastDate = new Date(year, month + 1, 0).getDate()
  
  // Create map for quick lookup
  const highlightMap = {}
  highlightedDates.forEach(item => {
    highlightMap[item.date] = item.type
  })
  
  // Check if date is today
  const isToday = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }
  
  // Get date string for a specific day
  const getDateString = (day) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
  }
  
  // Render empty cells before first day
  const renderEmptyCells = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    return cells
  }
  
  // Render day cells
  const renderDays = () => {
    const days = []
    for (let day = 1; day <= lastDate; day++) {
      const dateString = getDateString(day)
      const highlightType = highlightMap[dateString]
      
      let className = 'calendar-day'
      if (highlightType) className += ` ${highlightType}`
      if (isToday(day)) className += ' today'
      if (onDayClick) className += ' clickable'
      
      days.push(
        <div
          key={day}
          className={className}
          onClick={() => onDayClick && onDayClick(dateString)}
        >
          {day}
        </div>
      )
    }
    return days
  }

  return (
    <div className="calendar">
      {/* Header */}
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

      {/* Weekday labels */}
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Days grid */}
      <div className="calendar-days">
        {renderEmptyCells()}
        {renderDays()}
      </div>
    </div>
  )
}

export default Calendar