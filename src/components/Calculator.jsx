import { useState } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate' // New Import

function Calculator() {
  const today = new Date().toISOString().split('T')[0]
  const timeUnits = getTimeUnits()
  
  // Existing State
  const [totalValue, setTotalValue] = useState(500)
  const [totalUnit, setTotalUnit] = useState('hour')
  const [dailyValue, setDailyValue] = useState(8)
  const [dailyUnit, setDailyUnit] = useState('hour')
  const [startDate, setStartDate] = useState(today)
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5])
  
  // --- NEW STATE FOR HOLIDAYS ---
  const [excludedDates, setExcludedDates] = useState([])
  const [result, setResult] = useState(null)

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
    setWorkingDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  // --- NEW TOGGLE LOGIC FOR EXCLUDED DATES ---
  const toggleExcludedDate = (dateString) => {
    setExcludedDates(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString].sort()
    )
  }

  const handleCalculate = () => {
    const result = calculateFinishDate(
      parseFloat(totalValue),
      totalUnit,
      parseFloat(dailyValue),
      dailyUnit,
      workingDays,
      startDate,
      excludedDates // <-- Pass the new array here
    )
    console.log('Working days array:', result.workingDaysArray)
    setResult(result)
  }

  const isDisabled = !totalValue || !dailyValue || workingDays.length === 0

  return (
    <div className="calculator">
      {/* Total Time Input */}
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

      {/* Daily Time Input */}
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

      {/* Start Date Input */}
      <div className="input-group">
        <label htmlFor="start-date">Start date:</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* Working Days Selector */}
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

      {/* --- NEW EXCLUDE DATE COMPONENT --- */}
      <ExcludeDate 
        excludedDates={excludedDates}
        onToggleDate={toggleExcludedDate}
        onClearAll={() => setExcludedDates([])}
      />

      {/* Calculate Button */}
      <button 
        className="calculate-button"
        onClick={handleCalculate}
        disabled={isDisabled}
      >
        Calculate
      </button>

      {/* Results */}
      {result && <ResultsDisplay result={result} />}
    </div>
  )
}

export default Calculator