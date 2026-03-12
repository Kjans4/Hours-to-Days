import { useState, useEffect } from 'react'

function ProgressTracker({ result }) {
  const [currentDay, setCurrentDay] = useState(1)
  const [hoursLogged, setHoursLogged] = useState(0)
  const [showLogModal, setShowLogModal] = useState(false)
  const [todayHours, setTodayHours] = useState('')

  // Calculate progress
  const totalWorkdays = result.workdays
  const totalHours = parseFloat(result.totalHours)
  const hoursPerDay = parseFloat(result.hoursPerDay)
  
  const progressPercent = Math.min(100, (hoursLogged / totalHours) * 100)
  const daysCompleted = Math.floor(hoursLogged / hoursPerDay)
  const hoursRemaining = Math.max(0, totalHours - hoursLogged)
  const daysRemaining = Math.max(0, totalWorkdays - daysCompleted)

  // Calculate estimated completion date based on progress
  const today = new Date()
  const estimatedDaysLeft = Math.ceil(hoursRemaining / hoursPerDay)
  const estimatedCompletion = new Date(today)
  estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDaysLeft)

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('projectProgress')
    if (savedProgress) {
      const data = JSON.parse(savedProgress)
      setHoursLogged(data.hoursLogged || 0)
      setCurrentDay(data.currentDay || 1)
    }
  }, [])

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('projectProgress', JSON.stringify({
      hoursLogged,
      currentDay,
      lastUpdated: new Date().toISOString()
    }))
  }, [hoursLogged, currentDay])

  const handleLogHours = () => {
    const hours = parseFloat(todayHours)
    if (hours && hours > 0 && hours <= 24) {
      setHoursLogged(prev => prev + hours)
      setCurrentDay(prev => prev + 1)
      setTodayHours('')
      setShowLogModal(false)
    } else {
      alert('Please enter valid hours (0-24)')
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      setHoursLogged(0)
      setCurrentDay(1)
      localStorage.removeItem('projectProgress')
    }
  }

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>📊 Project Progress</h3>
        <button className="log-hours-btn" onClick={() => setShowLogModal(true)}>
          + Log Hours
        </button>
      </div>

      {/* Progress Stats */}
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Day</span>
          <span className="stat-value">{daysCompleted} of {totalWorkdays}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hours</span>
          <span className="stat-value">{hoursLogged.toFixed(1)} of {totalHours}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{hoursRemaining.toFixed(1)} hrs</span>
        </div>
      </div>

      {/* Progress Bar */}
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

      {/* Status Message */}
      <div className="progress-status">
        {progressPercent === 0 ? (
          <p className="status-message">🚀 Ready to start! Log your first hours.</p>
        ) : progressPercent < 100 ? (
          <p className="status-message">
            ⏳ {daysRemaining.toFixed(1)} days remaining · Est. completion: {estimatedCompletion.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        ) : (
          <p className="status-message success">
            🎉 Project completed! Great work!
          </p>
        )}
      </div>

      {/* Reset Button */}
      <button className="reset-progress-btn" onClick={handleReset}>
        Reset Progress
      </button>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="log-modal-backdrop" onClick={() => setShowLogModal(false)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Log Hours Worked</h4>
            <p>How many hours did you work today?</p>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              placeholder="8.0"
              value={todayHours}
              onChange={(e) => setTodayHours(e.target.value)}
              autoFocus
            />
            <div className="log-modal-actions">
              <button onClick={() => setShowLogModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleLogHours} className="submit-btn">
                Log Hours
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker