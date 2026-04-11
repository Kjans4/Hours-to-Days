function ProgressTracker({ result, completedDates = {} }) {
  const totalWorkdays = result.workdays
  const totalHours = parseFloat(result.totalHours)
  const hoursPerDay = parseFloat(result.hoursPerDay)

  const completedEntries = Object.values(completedDates)
  const hoursLogged = completedEntries.reduce((sum, d) => sum + (d.hours || 0), 0)
  const daysCompleted = completedEntries.length

  const progressPercent = Math.min(100, (hoursLogged / totalHours) * 100)
  const hoursRemaining = Math.max(0, totalHours - hoursLogged)
  const daysRemaining = Math.max(0, totalWorkdays - daysCompleted)

  /**
   * FIX: estimated completion advances by WORKDAYS, not calendar days.
   * Uses result.workingDays to know which days of the week are working days,
   * then counts forward that many working days from today.
   */
  const workingDaySet = new Set(result.workingDays || [1, 2, 3, 4, 5])
  const workdaysLeft = Math.ceil(hoursRemaining / hoursPerDay)

  const estimatedCompletion = (() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    let counted = 0
    while (counted < workdaysLeft) {
      date.setDate(date.getDate() + 1)
      if (workingDaySet.has(date.getDay())) counted++
    }
    return date
  })()

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>📊 Project Progress</h3>
        <span className="progress-driven-label">Via calendar</span>
      </div>

      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Days Done</span>
          <span className="stat-value">{daysCompleted} / {totalWorkdays}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hours Done</span>
          <span className="stat-value">{hoursLogged.toFixed(1)} / {totalHours}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{hoursRemaining.toFixed(1)} hrs</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          >
            {progressPercent > 10 && (
              <span className="progress-percent">{progressPercent.toFixed(0)}%</span>
            )}
          </div>
        </div>
        {progressPercent <= 10 && (
          <span className="progress-percent-outside">{progressPercent.toFixed(0)}%</span>
        )}
      </div>

      <div className="progress-status">
        {progressPercent === 0 ? (
          <p className="status-message">
            🗓️ Check off days on the timeline below to track progress.
          </p>
        ) : progressPercent < 100 ? (
          <p className="status-message">
            ⏳ {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left · Est.{' '}
            {estimatedCompletion.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        ) : (
          <p className="status-message success">
            🎉 All done! Great work!
          </p>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker