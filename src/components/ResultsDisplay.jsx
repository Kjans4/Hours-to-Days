import TimelineCalendar from './TimelineCalendar'

function ResultsDisplay({ result }) {
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

      {/* Workdays Needed */}
      <div className="result-item">
        <span>Workdays needed:</span>
        <strong>{result.workdays}</strong>
      </div>

      {/* Finish Date */}
      <div className="result-item">
        <span>Finish date:</span>
        <strong>{formatDate(result.finishDate)}</strong>
      </div>

      {/* Total Time */}
      <div className="result-item">
        <span>Total time:</span>
        <strong>
          {result.weeks} {result.weeks === 1 ? 'week' : 'weeks'}
          {result.remainingDays > 0 && ` + ${result.remainingDays} ${result.remainingDays === 1 ? 'day' : 'days'}`}
        </strong>
      </div>

      {/* Timeline Calendar - NEW! */}
      <TimelineCalendar 
        startDateString={result.startDateString}
        finishDateString={result.finishDateString}
        workingDaysArray={result.workingDaysArray}
      />

      {/* Calculation Steps */}
      <div className="calculation-steps">
        <h3>How we calculated:</h3>
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