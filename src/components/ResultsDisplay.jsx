import TimelineCalendar from './TimelineCalendar'
import ProgressTracker from './ProgressTracker'
import { useProjectContext } from './ProjectContext'

function ResultsDisplay({ result, activeProject }) {
  const { updateActiveProject } = useProjectContext()

  const dateData = activeProject?.dateData || {}

  /**
   * FIX: setDateData passes a functional updater all the way into
   * updateActiveProject, which resolves it against the CURRENT project
   * inside the setState callback — never a stale snapshot.
   *
   * TimelineCalendar calls: setDateData(prev => ({ ...prev, [date]: data }))
   * That function is passed as-is to updateActiveProject, which calls it
   * with the live current project inside update(s => ...).
   */
  const setDateData = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      // Pass functional updater through — resolved against current project
      updateActiveProject(currentProject => ({
        dateData: updaterOrValue(currentProject.dateData || {})
      }))
    } else {
      updateActiveProject({ dateData: updaterOrValue })
    }
  }

  // Derive completedDates for ProgressTracker
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