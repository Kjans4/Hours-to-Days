import TimelineCalendar from './TimelineCalendar'
import ProgressTracker from './ProgressTracker'
import { useProjectContext } from './ProjectContext'

function ResultsDisplay({ result, activeProject }) {
  const { updateActiveProject } = useProjectContext()

  const dateData = activeProject?.dateData || {}

  /**
   * setDateData — always resolves functional updaters against the
   * current activeProject.dateData before calling updateActiveProject.
   * This ensures we never write stale data.
   */
  const setDateData = (updater) => {
    const next = typeof updater === 'function'
      ? updater(activeProject?.dateData || {})
      : updater
    updateActiveProject({ dateData: next })
  }

  const completedDates = {}
  Object.entries(dateData).forEach(([date, data]) => {
    if (data?.completed) {
      completedDates[date] = { hours: data.hours ?? parseFloat(result.hoursPerDay) }
    }
  })

  return (
    <div className="results">
      <h2>Results</h2>

      <ProgressTracker result={result} completedDates={completedDates} />

      <div className="result-item">
        <span>Workdays needed:</span>
        <strong>{result.workdays}</strong>
      </div>

      <div className="result-item">
        <span>Finish date:</span>
        <strong>{result.finishDate.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}</strong>
      </div>

      <div className="result-item">
        <span>Total time:</span>
        <strong>
          {result.weeks} {result.weeks === 1 ? 'week' : 'weeks'}
          {result.remainingDays > 0 && ` + ${result.remainingDays} ${result.remainingDays === 1 ? 'day' : 'days'}`}
        </strong>
      </div>

      <TimelineCalendar
        startDateString={result.startDateString}
        finishDateString={result.finishDateString}
        workingDaysArray={result.workingDaysArray}
        hoursPerDay={parseFloat(result.hoursPerDay)}
        dateData={dateData}
        setDateData={setDateData}
      />

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