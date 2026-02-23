import React, { useState } from 'react';

const ExcludeDate = ({ excludedDates, onToggleDate, onClearAll }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Calendar Logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const handleDateClick = (day) => {
    // Format as YYYY-MM-DD for consistency
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onToggleDate(dateStr);
  };

  return (
    <div className="holiday-container">
      {/* Toggle Header */}
      <button 
        className={`holiday-toggle ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="icon">{isExpanded ? '▼' : '▶'}</span>
        Exclude holidays/dates 
        {excludedDates.length > 0 && <span className="count">({excludedDates.length})</span>}
      </button>

      {isExpanded && (
        <div className="holiday-content">
          {/* 1. ExclusionCalendar Section */}
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <button onClick={() => changeMonth(-1)}>◀</button>
              <h4>{monthName} {year}</h4>
              <button onClick={() => changeMonth(+1)}>▶</button>
            </div>
            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="weekday-label">{d}</div>
              ))}
              {Array(firstDayOfMonth(year, month)).fill(null).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {[...Array(daysInMonth(year, month))].map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isExcluded = excludedDates.includes(dateStr);
                return (
                  <button 
                    key={day} 
                    className={`day-btn ${isExcluded ? 'excluded' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ExcludedDatesList Section */}
          <div className="dates-list-wrapper">
            {excludedDates.length === 0 ? (
              <p className="empty-msg">Click calendar dates to exclude them.</p>
            ) : (
              <>
                <div className="tags-container">
                  {excludedDates.map(date => (
                    <div key={date} className="date-tag">
                      {date}
                      <button onClick={() => onToggleDate(date)}>×</button>
                    </div>
                  ))}
                </div>
                <button className="clear-btn" onClick={onClearAll}>Clear All</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcludeDate;