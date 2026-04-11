import { useState, useEffect, useRef } from 'react'
import { calculateFinishDate, getTimeUnits } from '../utils/calculations'
import ResultsDisplay from './ResultsDisplay'
import ExcludeDate from './ExcludeDate'
import { useProjectContext } from './ProjectContext'

function Calculator({ activeProject }) {
  const { updateActiveProject } = useProjectContext()
  const timeUnits = getTimeUnits()

  const [result, setResult] = useState(null)
  const [isStale, setIsStale] = useState(false)

  const [localTotalValue, setLocalTotalValue] = useState('')
  const [localDailyValue, setLocalDailyValue] = useState('')

  const prevProjectId = useRef(null)

  /**
   * FIX: only sync local inputs when the project ID changes (project switch).
   * We do NOT include totalValue/dailyValue in deps — that would overwrite
   * what the user is currently typing whenever any external update touches
   * those fields (e.g. duplication, Firebase sync).
   */
  useEffect(() => {
    if (!activeProject) return

    const projectChanged = prevProjectId.current !== activeProject.id
    prevProjectId.current = activeProject.id

    if (projectChanged) {
      // Project switched — load fresh values and clear result
      setLocalTotalValue(String(activeProject.totalValue ?? ''))
      setLocalDailyValue(String(activeProject.dailyValue ?? ''))
      setResult(null)
      setIsStale(false)
    }
  }, [activeProject?.id]) // ← ONLY react to project ID change, not value changes

  if (!activeProject) return null

  const { totalUnit, dailyUnit, startDate, workingDays, excludedDates } = activeProject

  const markStale = () => { if (result) setIsStale(true) }

  const update = (fields) => {
    updateActiveProject(fields)
    markStale()
  }

  const handleTotalBlur = () => {
    const val = parseFloat(localTotalValue)
    if (!isNaN(val) && val > 0) update({ totalValue: val })
  }

  const handleDailyBlur = () => {
    const val = parseFloat(localDailyValue)
    if (!isNaN(val) && val > 0) update({ dailyValue: val })
  }

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

  const handleCalculate = () => {
    const totalVal = parseFloat(localTotalValue)
    const dailyVal = parseFloat(localDailyValue)
    if (isNaN(totalVal) || isNaN(dailyVal)) return

    updateActiveProject({ totalValue: totalVal, dailyValue: dailyVal })

    const res = calculateFinishDate(
      totalVal, totalUnit, dailyVal, dailyUnit,
      workingDays, startDate, excludedDates
    )
    setResult(res)
    setIsStale(false)
  }

  const isDisabled =
    !localTotalValue || !localDailyValue ||
    parseFloat(localTotalValue) <= 0 ||
    parseFloat(localDailyValue) <= 0 ||
    workingDays.length === 0

  const weekdays = [
    { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  return (
    <div className="calculator">
      <div className="calculator-project-bar" style={{ background: activeProject.color }}>
        <span>{activeProject.emoji}</span>
        <span>{activeProject.name}</span>
      </div>

      <div className="input-group">
        <label htmlFor="total-time">Total time needed:</label>
        <div className="input-with-unit">
          <input
            id="total-time" type="number"
            value={localTotalValue}
            onChange={(e) => { setLocalTotalValue(e.target.value); markStale() }}
            onBlur={handleTotalBlur}
            min="0" step="any"
          />
          <select value={totalUnit} onChange={handleSelectChange('totalUnit')}>
            {timeUnits.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="daily-time">Time per day:</label>
        <div className="input-with-unit">
          <input
            id="daily-time" type="number"
            value={localDailyValue}
            onChange={(e) => { setLocalDailyValue(e.target.value); markStale() }}
            onBlur={handleDailyBlur}
            min="0" step="any"
          />
          <select value={dailyUnit} onChange={handleSelectChange('dailyUnit')}>
            {timeUnits.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="start-date">Start date:</label>
        <input
          id="start-date" type="date"
          value={startDate}
          onChange={(e) => update({ startDate: e.target.value })}
        />
      </div>

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

      <ExcludeDate
        excludedDates={excludedDates}
        onToggleDate={toggleExcludedDate}
        onClearAll={() => update({ excludedDates: [] })}
      />

      {isStale && (
        <div className="stale-banner">
          ⚠️ Inputs changed — press Calculate to update the timeline
        </div>
      )}

      <button
        className={`calculate-button ${isStale ? 'calculate-button--stale' : ''}`}
        onClick={handleCalculate}
        disabled={isDisabled}
      >
        {isStale ? '🔄 Recalculate' : 'Calculate'}
      </button>

      {result && !isStale && (
        <ResultsDisplay result={result} activeProject={activeProject} />
      )}
    </div>
  )
}

export default Calculator