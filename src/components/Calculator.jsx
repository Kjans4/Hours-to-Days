import { useState, useEffect, useRef } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate'
import { useProjects } from '../hooks/useProjects'

/**
 * Calculator Component
 *
 * KEY FIX: result is cleared whenever any input changes so the calendar
 * never shows stale data. A "recalculate" banner appears to guide the user.
 *
 * Number inputs use local state while typing, sync to project on blur.
 * All other inputs sync immediately and also clear result.
 */
function Calculator({ activeProject }) {
  const { updateActiveProject } = useProjects()
  const timeUnits = getTimeUnits()

  const [result, setResult] = useState(null)
  const [isStale, setIsStale] = useState(false) // inputs changed after last calc

  // Local state for number inputs (avoids update-on-every-keystroke)
  const [localTotalValue, setLocalTotalValue] = useState('')
  const [localDailyValue, setLocalDailyValue] = useState('')

  // Track previous project ID so we can reset on project switch
  const prevProjectId = useRef(null)

  // Sync local inputs when active project changes (project switch or first load)
  useEffect(() => {
    if (!activeProject) return

    const projectChanged = prevProjectId.current !== activeProject.id
    prevProjectId.current = activeProject.id

    setLocalTotalValue(String(activeProject.totalValue ?? ''))
    setLocalDailyValue(String(activeProject.dailyValue ?? ''))

    if (projectChanged) {
      // Clear result when switching projects
      setResult(null)
      setIsStale(false)
    }
  }, [activeProject?.id, activeProject?.totalValue, activeProject?.dailyValue])

  if (!activeProject) return null

  const {
    totalUnit,
    dailyUnit,
    startDate,
    workingDays,
    excludedDates,
  } = activeProject

  // ─── Helpers ─────────────────────────────────────────────────────────────

  // Mark result as stale whenever any input changes
  const markStale = () => {
    if (result) setIsStale(true)
  }

  // Update project + mark stale
  const update = (fields) => {
    updateActiveProject(fields)
    markStale()
  }

  // Number inputs: sync on blur
  const handleTotalBlur = () => {
    const val = parseFloat(localTotalValue)
    if (!isNaN(val) && val > 0) update({ totalValue: val })
  }

  const handleDailyBlur = () => {
    const val = parseFloat(localDailyValue)
    if (!isNaN(val) && val > 0) update({ dailyValue: val })
  }

  // Select/date: sync immediately
  const handleSelectChange = (field) => (e) => update({ [field]: e.target.value })

  const toggleDay = (dayValue) => {
    update({
      workingDays: workingDays.includes(dayValue)
        ? workingDays.filter(d => d !== dayValue)
        : [...workingDays, dayValue].sort()
    })
  }

  const toggleExcludedDate = (dateString) => {
    update({
      excludedDates: excludedDates.includes(dateString)
        ? excludedDates.filter(d => d !== dateString)
        : [...excludedDates, dateString].sort()
    })
  }

  // ─── Calculate ────────────────────────────────────────────────────────────

  const handleCalculate = () => {
    const totalVal = parseFloat(localTotalValue)
    const dailyVal = parseFloat(localDailyValue)
    if (isNaN(totalVal) || isNaN(dailyVal)) return

    // Persist latest number values first
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
    setIsStale(false)
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
            onChange={(e) => { setLocalTotalValue(e.target.value); markStale() }}
            onBlur={handleTotalBlur}
            min="0"
            step="any"
          />
          <select value={totalUnit} onChange={handleSelectChange('totalUnit')}>
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
            onChange={(e) => { setLocalDailyValue(e.target.value); markStale() }}
            onBlur={handleDailyBlur}
            min="0"
            step="any"
          />
          <select value={dailyUnit} onChange={handleSelectChange('dailyUnit')}>
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
          onChange={(e) => update({ startDate: e.target.value })}
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
        onClearAll={() => update({ excludedDates: [] })}
      />

      {/* Stale banner — shown when inputs changed after last calculation */}
      {isStale && (
        <div className="stale-banner">
          ⚠️ Inputs changed — press Calculate to update the timeline
        </div>
      )}

      {/* Calculate */}
      <button
        className={`calculate-button ${isStale ? 'calculate-button--stale' : ''}`}
        onClick={handleCalculate}
        disabled={isDisabled}
      >
        {isStale ? '🔄 Recalculate' : 'Calculate'}
      </button>

      {/* Results — only shown when not stale */}
      {result && !isStale && (
        <ResultsDisplay
          result={result}
          activeProject={activeProject}
        />
      )}
    </div>
  )
}

export default Calculator