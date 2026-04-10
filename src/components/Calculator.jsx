import { useState } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate'
import { useProjects } from '../hooks/useProjects'

/**
 * Calculator Component
 * All inputs are read from and written to the active project via useProjects.
 * No more flat localStorage keys — everything is project-scoped.
 */
function Calculator({ activeProject }) {
  const { updateActiveProject } = useProjects()
  const timeUnits = getTimeUnits()
  const [result, setResult] = useState(null)

  // Guard: if no active project yet (first load), show nothing
  if (!activeProject) return null

  // Read all inputs from the active project
  const {
    totalValue,
    totalUnit,
    dailyValue,
    dailyUnit,
    startDate,
    workingDays,
    excludedDates,
  } = activeProject

  // Helpers to update a single field on the active project
  const set = (field) => (value) => updateActiveProject({ [field]: value })

  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

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
    const res = calculateFinishDate(
      parseFloat(totalValue),
      totalUnit,
      parseFloat(dailyValue),
      dailyUnit,
      workingDays,
      startDate,
      excludedDates
    )
    setResult(res)
  }

  const isDisabled = !totalValue || !dailyValue || workingDays.length === 0

  return (
    <div className="calculator">
      {/* Project color accent bar */}
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
            value={totalValue}
            onChange={(e) => set('totalValue')(e.target.value)}
            min="0"
            step="any"
          />
          <select value={totalUnit} onChange={(e) => set('totalUnit')(e.target.value)}>
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
            value={dailyValue}
            onChange={(e) => set('dailyValue')(e.target.value)}
            min="0"
            step="any"
          />
          <select value={dailyUnit} onChange={(e) => set('dailyUnit')(e.target.value)}>
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
          onChange={(e) => set('startDate')(e.target.value)}
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