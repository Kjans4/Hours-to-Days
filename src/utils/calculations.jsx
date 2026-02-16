/**
 * Time unit conversion rates (everything converted to hours)
 */
const TIME_UNITS = {
  millisecond: 1 / 3600000,
  second: 1 / 3600,
  minute: 1 / 60,
  hour: 1,
  day: 24,
  week: 168,
  month: 730, // ~30.42 days average
  year: 8760, // 365 days
  decade: 87600,
  century: 876000
};

/**
 * Convert any time unit to hours
 * @param {number} value - The value to convert
 * @param {string} unit - The unit to convert from
 * @returns {number} - Value in hours
 */
export function convertToHours(value, unit) {
  return value * TIME_UNITS[unit];
}

/**
 * Parse date string correctly (avoids timezone issues)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date}
 */
function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Calculate finish date from total time
 * @param {number} totalValue - Total time needed
 * @param {string} totalUnit - Unit of total time
 * @param {number} dailyValue - Time worked per day
 * @param {string} dailyUnit - Unit of daily time
 * @param {number[]} workingDays - Array of working day numbers (0=Sun, 1=Mon, etc.)
 * @param {string} startDate - Starting date in YYYY-MM-DD format
 * @returns {Object} - { workdays, finishDate, calendarDays, weeks, remainingDays, steps }
 */
export function calculateFinishDate(totalValue, totalUnit, dailyValue, dailyUnit, workingDays, startDate) {
  // Validate inputs
  if (!totalValue || !dailyValue || workingDays.length === 0) {
    return null;
  }

  // Convert both values to hours
  const totalHours = convertToHours(totalValue, totalUnit);
  const hoursPerDay = convertToHours(dailyValue, dailyUnit);

  // Step 1: Calculate total workdays needed
  const totalWorkdays = totalHours / hoursPerDay;
  const totalWorkdaysFormatted = Number(totalWorkdays.toFixed(1));
  
  // Step 2: Find finish date by counting workdays (use parseDate to avoid timezone issues)
  let currentDate = parseDate(startDate);
  let remainingWorkdays = totalWorkdays;
  let workdaysCount = 0;
  
  while (remainingWorkdays > 0) {
    const dayOfWeek = currentDate.getDay();
    
    // If this is a working day, subtract 1 workday
    if (workingDays.includes(dayOfWeek)) {
      remainingWorkdays -= 1;
      workdaysCount += 1;
    }
    
    // Move to next day if we're not done
    if (remainingWorkdays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  const finishDate = new Date(currentDate);
  
  // Step 3: Calculate calendar days (use parseDate for start date)
  const start = parseDate(startDate);
  const calendarDays = Math.floor((finishDate - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // Step 4: Calculate weeks and remaining days
  const weeks = Math.floor(calendarDays / 7);
  const remainingDays = calendarDays % 7;
  
  // Step 5: Generate calculation steps
  const steps = [
    `${totalValue} ${totalUnit}${totalValue !== 1 ? 's' : ''} = ${totalHours.toFixed(1)} hours`,
    `${dailyValue} ${dailyUnit}${dailyValue !== 1 ? 's' : ''} per day = ${hoursPerDay.toFixed(1)} hours/day`,
    `${totalHours.toFixed(1)} hours ÷ ${hoursPerDay.toFixed(1)} hours/day = ${totalWorkdaysFormatted} workdays`,
    `Starting ${formatDate(start)}, count ${totalWorkdaysFormatted} workdays on selected days`,
    `Finish date = ${formatDate(finishDate)}`,
    `Total calendar time = ${weeks} ${weeks === 1 ? 'week' : 'weeks'}${remainingDays > 0 ? ` + ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}` : ''}`
  ];
  
  return {
    workdays: totalWorkdaysFormatted,
    finishDate,
    calendarDays,
    weeks,
    remainingDays,
    steps,
    totalHours: totalHours.toFixed(1),
    hoursPerDay: hoursPerDay.toFixed(1)
  };
}

/**
 * Format date to readable string
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get list of available time units
 */
export function getTimeUnits() {
  return [
    { value: 'millisecond', label: 'Milliseconds' },
    { value: 'second', label: 'Seconds' },
    { value: 'minute', label: 'Minutes' },
    { value: 'hour', label: 'Hours' },
    { value: 'day', label: 'Days' },
    { value: 'week', label: 'Weeks' },
    { value: 'month', label: 'Months' },
    { value: 'year', label: 'Years' },
    { value: 'decade', label: 'Decades' },
    { value: 'century', label: 'Centuries' }
  ];
}