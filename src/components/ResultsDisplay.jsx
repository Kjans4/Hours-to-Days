import TimelineCalendar from './TimelineCalendar'

/**
 * ResultsDisplay Component
 * Receives the 'result' object and displays the final project timeline, 
 * including a calendar view and a step-by-step breakdown.
 */
function ResultsDisplay({ result }) {
  
  /**
   * Helper: Formats a Date object into a full readable string.
   * Example: "Friday, March 7, 2026"
   */
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="results">
      <h2>Results</h2>

      {/* 1. WORKDAYS: Total number of actual labor days required */}
      <div className="result-item">
        <span>Workdays needed:</span>
        <strong>{result.workdays}</strong>
      </div>

      {/* 2. FINISH DATE: The calculated end date after accounting for weekends/holidays */}
      <div className="result-item">
        <span>Finish date:</span>
        <strong>{formatDate(result.finishDate)}</strong>
      </div>

      {/* 3. DURATION SUMMARY: 
          Converts the total time into a friendly "X weeks and Y days" format.
          Includes pluralization logic (e.g., "1 week" vs "2 weeks").
      */}
      <div className="result-item">
        <span>Total time:</span>
        <strong>
          {result.weeks} {result.weeks === 1 ? 'week' : 'weeks'}
          {result.remainingDays > 0 && ` + ${result.remainingDays} ${result.remainingDays === 1 ? 'day' : 'days'}`}
        </strong>
      </div>

      {/* 4. VISUAL TIMELINE: 
          Renders the TimelineCalendar component using ISO strings for consistency.
          This gives the user a visual "map" of the project span.
      */}
      <TimelineCalendar 
        startDateString={result.startDateString}
        finishDateString={result.finishDateString}
        workingDaysArray={result.workingDaysArray}
      />

      {/* 5. AUDIT TRAIL: 
          Iterates through an array of strings (result.steps) to show the math.
          This is great for transparency, showing the user exactly how 
          hours were converted to days.
      */}
      <div className="calculation-steps">
        <h3>How it is calculated:</h3>
        <ol>
          {result.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default ResultsDisplay