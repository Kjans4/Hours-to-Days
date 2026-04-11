import { useState, useEffect } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate'
import { useProjects } from '../hooks/useProjects'

/**
 * Calculator Component
 *
 * FIX: Number inputs use LOCAL state while the user types,
 * then sync to the project on blur. This prevents every keystroke
 * from firing updateActiveProject and causing stale-closure issues.
 *
 * Select and date inputs sync immediately (no debounce needed).
 */
function Calculator({ activeProject }) {
  const { updateActiveProject } = useProjects()
  const timeUnits = getTimeUnits()
  const [result, setResult] = useState(null)

  // Local controlled state for number inputs (avoids update-on-every-keystroke)
  const [localTotalValue, setLocalTotalValue] = useState('')
  const [localDailyValue, setLocalDailyValue] = useState('')

  // Sync local inputs when the active project changes (e.g. switching projects)
  useEffect(() => {
    if (activeProject) {
      setLocalTotalValue(String(activeProject.totalValue ?? ''))
      setLocalDailyValue(String(activeProject.dailyValue ?? ''))
      // Reset result when switching projects so stale results don't show
      setResult(null)
    }
  }, [activeProject?.id]) // only re-sync when the project ID changes

  if (!activeProject) return null

  const {
    totalUnit,
    dailyUnit,
    startDate,
    workingDays,
    excludedDates,
  } = activeProject

  // Sync number input to project on blur
  const handleTotalBlur = () => {
    const val = parseFloat(localTotalValue)
    if (!isNaN(val) && val > 0) updateActiveProject({ totalValue: val })
  }

  const handleDailyBlur = () => {
    const val = parseFloat(localDailyValue)
    if (!isNaN(val) && val > 0) updateActiveProject({ dailyValue: val })
  }

  // Select and date inputs sync immediately
  const handleSelectChange = (field) => (e) => {
    updateActiveProject({ [field]: e.target.value })
  }

  const toggleDay = (dayValue) => {
    updateActiveProject({
      workingDays: workingDays.includes(dayValue)
        ? workingDays.filter(d => d !== dayValue)
        : [...workingDays, dayValue].sort()
    })
  }

  const toggleExcludedDate = (dateString) => {
    updateActiveProject({
      excludedDates: excludedDates.includes(dateString)
        ? excludedDates.filter(d => d !== dateString)
        : [...excludedDates, dateString].sort()
    })
  }

  const handleCalculate = () => {
    // Use local values for calculation in case user hasn't blurred yet
    const totalVal = parseFloat(localTotalValue)
    const dailyVal = parseFloat(localDailyValue)

    if (isNaN(totalVal) || isNaN(dailyVal)) return

    // Persist latest values before calculating
    updateActiveProject({ totalValue: totalVal, dailyValue: dailyVal })

    const res = calculateFinishDate(
      totalVal,
      totalUnit,
      dailyVal,
      dailyUnit,
      workingDays,
      startDate,
      excludedDates
    )
    setResult(res)
  }

  const isDisabled =
    !localTotalValue ||
    !localDailyValue ||
    parseFloat(localTotalValue) <= 0 ||
    parseFloat(localDailyValue) <= 0 ||
    workingDays.length === 0

  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  return (
    <div className="calculator">
      {/* Project color bar */}
      <div
        className="calculator-project-bar"
        style={{ background: activeProject.color }}
      >
        <span>{activeProject.emoji}</span>
        <span>{activeProject.name}</span>
      </div>

      {/* Total Effort */}
      <div className="input-group">
        <label htmlFor="total-time">Total time needed:</label>
        <div className="input-with-unit">
          <input
            id="total-time"
            type="number"
            value={localTotalValue}
            onChange={(e) => setLocalTotalValue(e.target.value)}
            onBlur={handleTotalBlur}
            min="0"
            step="any"
          />
          <select
            value={totalUnit}
            onChange={handleSelectChange('totalUnit')}
          >
            {timeUnits.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Capacity */}
      <div className="input-group">
        <label htmlFor="daily-time">Time per day:</label>
        <div className="input-with-unit">
          <input
            id="daily-time"
            type="number"
            value={localDailyValue}
            onChange={(e) => setLocalDailyValue(e.target.value)}
            onBlur={handleDailyBlur}
            min="0"
            step="any"
          />
          <select
            value={dailyUnit}
            onChange={handleSelectChange('dailyUnit')}
          >
            {timeUnits.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Start Date */}
      <div className="input-group">
        <label htmlFor="start-date">Start date:</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => updateActiveProject({ startDate: e.target.value })}
        />
      </div>

      {/* Working Days */}
      <div className="input-group">
        <label>Working days:</label>
        <div className="weekday-selector">
          {weekdays.map(day => (
            <label key={day.value} className="weekday-checkbox">
              <input
                type="checkbox"
                checked={workingDays.includes(day.value)}
                onChange={() => toggleDay(day.value)}
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Excluded Dates */}
      <ExcludeDate
        excludedDates={excludedDates}
        onToggleDate={toggleExcludedDate}
        onClearAll={() => updateActiveProject({ excludedDates: [] })}
      />

      {/* Calculate */}
      <button
        className="calculate-button"
        onClick={handleCalculate}
        disabled={isDisabled}
      >
        Calculate
      </button>

      {/* Results */}
      {result && (
        <ResultsDisplay
          result={result}
          activeProject={activeProject}
        />
      )}
    </div>
  )
}

export default Calculator