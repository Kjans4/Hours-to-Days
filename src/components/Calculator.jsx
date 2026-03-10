import { useState } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useFirebaseStorage } from '../hooks/useFirebaseStorage'

/**
 * Calculator Component
 * Manages the state and logic for calculating a project finish date based on 
 * total effort, daily capacity, and specific working/excluded days.
 */
function Calculator() {
  // Sets default start date to today in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // Helper to get available units (e.g., hours, days, weeks) for the dropdowns
  const timeUnits = getTimeUnits()
  
  /**
   * PERSISTENT STATE
   * These values use useLocalStorage so the user doesn't lose their data 
   * when they refresh the page.
   */
  const [totalValue, setTotalValue] = useFirebaseStorage('totalValue', 500)
const [totalUnit, setTotalUnit] = useFirebaseStorage('totalUnit', 'hour')
const [dailyValue, setDailyValue] = useFirebaseStorage('dailyValue', 8)
const [dailyUnit, setDailyUnit] = useFirebaseStorage('dailyUnit', 'hour')
const [startDate, setStartDate] = useFirebaseStorage('startDate', today)
const [workingDays, setWorkingDays] = useFirebaseStorage('workingDays', [1, 2, 3, 4, 5])
const [excludedDates, setExcludedDates] = useFirebaseStorage('excludedDates', [])

  
  /**
   * EPHEMERAL STATE
   * The calculation result is not persisted; it recalculates on user action.
   */
  const [result, setResult] = useState(null)

  // Configuration for the working days checkbox list
  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  /**
   * Toggles a weekday in or out of the workingDays array.
   * Ensures the array stays sorted for consistent logic.
   */
  const toggleDay = (dayValue) => {
    setWorkingDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  /**
   * Adds or removes a specific date from the exclusion list (holidays/vacations).
   */
  const toggleExcludedDate = (dateString) => {
    setExcludedDates(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString].sort()
    )
  }

  /**
   * Triggers the calculation utility function with current state values.
   * Converts string inputs to floats to ensure mathematical accuracy.
   */
  const handleCalculate = () => {
    const result = calculateFinishDate(
      parseFloat(totalValue),
      totalUnit,
      parseFloat(dailyValue),
      dailyUnit,
      workingDays,
      startDate,
      excludedDates
    )
    setResult(result)
  }

  // Basic validation: Prevent calculation if inputs are empty or no working days selected
  const isDisabled = !totalValue || !dailyValue || workingDays.length === 0

  return (
    <div className="calculator">
      {/* SECTION: Total Effort Input */}
      <div className="input-group">
        <label htmlFor="total-time">Total time needed:</label>
        <div className="input-with-unit">
          <input
            id="total-time"
            type="number"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            min="0"
            step="any"
          />
          <select 
            value={totalUnit} 
            onChange={(e) => setTotalUnit(e.target.value)}
          >
            {timeUnits.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION: Daily Capacity Input */}
      <div className="input-group">
        <label htmlFor="daily-time">Time per day:</label>
        <div className="input-with-unit">
          <input
            id="daily-time"
            type="number"
            value={dailyValue}
            onChange={(e) => setDailyValue(e.target.value)}
            min="0"
            step="any"
          />
          <select 
            value={dailyUnit} 
            onChange={(e) => setDailyUnit(e.target.value)}
          >
            {timeUnits.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION: Project Start Date */}
      <div className="input-group">
        <label htmlFor="start-date">Start date:</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* SECTION: Weekday Selection */}
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

      {/* SECTION: Custom Date Exclusions (Holidays, etc.) */}
      <ExcludeDate 
        excludedDates={excludedDates}
        onToggleDate={toggleExcludedDate}
        onClearAll={() => setExcludedDates([])}
      />

      {/* SECTION: Execution */}
      <button 
        className="calculate-button"
        onClick={handleCalculate}
        disabled={isDisabled}
      >
        Calculate
      </button>

      {/* SECTION: Display Result if calculation has been performed */}
      {result && <ResultsDisplay result={result} />}
    </div>
  )
}

export default Calculator