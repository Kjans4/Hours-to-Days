import { getMonthName } from '../utils/dateHelpers'

/**
 * Calendar Component
 * Renders a monthly calendar grid with support for highlighting specific dates,
 * navigation, and click interactions.
 */
function Calendar({ 
  year, 
  month, 
  highlightedDates = [], // Array of { date: 'YYYY-MM-DD', type: string, hasNote: bool }
  onDayClick = null,     // Callback function when a date is clicked
  showNavigation = false,
  onPrevMonth,
  onNextMonth
}) {
  /**
   * DATE CALCULATIONS
   * firstDay: Finds the day of the week (0-6) for the 1st of the month.
   * lastDate: Setting day '0' of the NEXT month effectively gives us the last day of THIS month.
   */
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  
  /**
   * OPTIMIZATION: Map Highlights
   * Converts the array of highlights into an object for O(1) lookup speed.
   * This prevents having to .find() or .filter() the array for every single day rendered.
   */
  const highlightMap = {}
  highlightedDates.forEach(item => {
    highlightMap[item.date] = {
      type: item.type,
      hasNote: item.hasNote || false 
    }
  })
  
  /**
   * Checks if a specific day is the current real-world "Today".
   */
  const isToday = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }
  
  /**
   * Formats day/month into a standard YYYY-MM-DD string for data matching.
   */
  const getDateString = (day) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
  }
  
  /**
   * ALIGNMENT LOGIC: Empty Cells
   * If the 1st of the month is a Wednesday (3), we need 3 empty <div>s 
   * so that "1" appears under the "Wed" column.
   */
  const renderEmptyCells = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    return cells
  }
  
  /**
   * GRID GENERATION
   * Loops through every day of the month and applies relevant CSS classes 
   * based on the highlightMap and current date.
   */
  const renderDays = () => {
    const days = []
    for (let day = 1; day <= lastDate; day++) {
      const dateString = getDateString(day)
      const dateData = highlightMap[dateString]
      const highlightType = dateData?.type
      const hasNote = dateData?.hasNote
      
      // Dynamic class string construction
      let className = 'calendar-day'
      if (highlightType) className += ` ${highlightType}` // e.g., 'holiday' or 'deadline'
      if (hasNote) className += ' has-note' 
      if (isToday(day)) className += ' today'
      if (onDayClick) className += ' clickable'
      
      days.push(
        <div
          key={day}
          className={className}
          onClick={() => onDayClick && onDayClick(dateString)}
        >
          <span>{day}</span>
        </div>
      )
    }
    return days
  }

  return (
    <div className="calendar">
      {/* HEADER: Navigation and Month/Year Label */}
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

      {/* WEEKDAY LABELS: Static row */}
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* THE GRID: Combines empty padding cells + actual date cells */}
      <div className="calendar-days">
        {renderEmptyCells()}
        {renderDays()}
      </div>
    </div>
  )
}

export default Calendar