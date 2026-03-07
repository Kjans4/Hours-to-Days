import React, { useState } from 'react';

/**
 * ExcludeDate Component
 * A collapsible UI that allows users to pick specific dates (like holidays) 
 * to skip in their project calculations.
 */
const ExcludeDate = ({ excludedDates, onToggleDate, onClearAll }) => {
  // isExpanded: Controls the accordion (show/hide calendar)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // viewDate: Tracks which month the user is currently looking at in the UI
  const [viewDate, setViewDate] = useState(new Date());

  /** * CALENDAR UTILITIES
   * daysInMonth: Uses the 'day 0' trick to get the total days in a month.
   * firstDayOfMonth: Gets 0-6 (Sun-Sat) for the 1st day to align the grid.
   */
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // toLocaleString: Automatically handles month names based on browser language
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  /**
   * Adjusts the viewable month. offset is usually -1 or +1.
   * Creating a new Date object handles year rollovers automatically (e.g., Dec + 1 = Jan).
   */
  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const handleDateClick = (day) => {
    // Standardizes date format to YYYY-MM-DD for storage and comparison
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onToggleDate(dateStr);
  };

  return (
    <div className="holiday-container">
      {/* SECTION: Accordion Toggle 
          Shows the count of excluded dates so the user sees data even when collapsed.
      */}
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
          
          {/* 1. CALENDAR UI 
              Renders the interactive grid for selecting dates.
          */}
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <button onClick={() => changeMonth(-1)}>◀</button>
              <h4>{monthName} {year}</h4>
              <button onClick={() => changeMonth(+1)}>▶</button>
            </div>
            
            <div className="calendar-grid">
              {/* Render Weekday Initials */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="weekday-label">{d}</div>
              ))}
              
              {/* PADDING: Create empty slots for days before the 1st of the month */}
              {Array(firstDayOfMonth(year, month)).fill(null).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {/* DATE BUTTONS: Renders each day and checks if it's currently 'excluded' */}
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

          {/* 2. SUMMARY LIST 
              A list of 'tags' representing selected dates, allowing for quick removal.
          */}
          <div className="dates-list-wrapper">
            {excludedDates.length === 0 ? (
              <p className="empty-msg">Click calendar dates to exclude them.</p>
            ) : (
              <>
                <div className="tags-container">
                  {excludedDates.map(date => (
                    <div key={date} className="date-tag">
                      {date}
                      {/* Clicking the '×' calls the same toggle function to remove it */}
                      <button onClick={() => onToggleDate(date)}>×</button>
                    </div>
                  ))}
                </div>
                {/* Clear All: Resets the entire exclusion array */}
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