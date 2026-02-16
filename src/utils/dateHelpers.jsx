/**
 * Format Date object to YYYY-MM-DD string
 * @param {Date} date 
 * @returns {string} - "2026-03-18"
 */
export function formatDateToString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date object
 * @param {string} dateString - "2026-03-18"
 * @returns {Date}
 */
export function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format date for display
 * @param {string} dateString - "2026-03-18"
 * @returns {string} - "Wednesday, March 18, 2026"
 */
export function formatDateForDisplay(dateString) {
  const date = parseDate(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

/**
 * Get array of months between two dates
 * @param {string} startDate - "2026-03-18"
 * @param {string} finishDate - "2026-06-10"
 * @returns {Array} - [{ year: 2026, month: 2 }, { year: 2026, month: 3 }, ...]
 */
export function getMonthsBetween(startDate, finishDate) {
  const start = parseDate(startDate)
  const finish = parseDate(finishDate)
  const months = []
  
  let current = new Date(start.getFullYear(), start.getMonth(), 1)
  const end = new Date(finish.getFullYear(), finish.getMonth(), 1)
  
  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth()
    })
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

/**
 * Filter dates for specific month
 * @param {Array} datesArray - [{ date: "2026-03-18", type: "start" }, ...]
 * @param {number} year 
 * @param {number} month - 0-indexed (0 = January)
 * @returns {Array}
 */
export function filterDatesForMonth(datesArray, year, month) {
  return datesArray.filter(item => {
    const date = parseDate(item.date)
    return date.getFullYear() === year && date.getMonth() === month
  })
}

/**
 * Get month name
 * @param {number} month - 0-indexed
 * @returns {string} - "January"
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month]
}