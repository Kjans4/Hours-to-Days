import { getMonthName } from '../utils/dateHelpers'

function Calendar({ 
  year, 
  month, 
  highlightedDates = [],
  onDayClick = null,
  showNavigation = false,
  onPrevMonth,
  onNextMonth
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  
  const highlightMap = {}
  highlightedDates.forEach(item => {
    highlightMap[item.date] = {
      type: item.type,
      hasNote: item.hasNote || false  // NEW
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
  
  const getDateString = (day) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
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
      
      let className = 'calendar-day'
      if (highlightType) className += ` ${highlightType}`
      if (hasNote) className += ' has-note'  // NEW
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