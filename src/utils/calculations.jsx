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
  month: 730,
  year: 8760,
  decade: 87600,
  century: 876000
};

/**
 * Convert any time unit to hours
 */
export function convertToHours(value, unit) {
  return value * TIME_UNITS[unit];
}

/**
 * Parse date string correctly (avoids timezone issues)
 */
function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format Date to YYYY-MM-DD
 */
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generate array of all working days in project
 * @returns {Array} - [{ date: 'YYYY-MM-DD', type: 'start|workday|finish' }]
 */
export function generateWorkingDaysArray(startDate, finishDate, workingDays) {
  const daysArray = []
  let currentDate = new Date(startDate)
  const lastDate = new Date(finishDate)
  
  while (currentDate <= lastDate) {
    const dayOfWeek = currentDate.getDay()
    const dateString = formatDateToYYYYMMDD(currentDate)
    
    if (workingDays.includes(dayOfWeek)) {
      let type = 'workday'
      
      // Mark start date
      if (currentDate.getTime() === startDate.getTime()) {
        type = 'start'
      }
      // Mark finish date
      else if (currentDate.getTime() === lastDate.getTime()) {
        type = 'finish'
      }
      
      daysArray.push({ date: dateString, type })
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return daysArray
}

/**
 * Calculate finish date from total time
 */
export function calculateFinishDate(totalValue, totalUnit, dailyValue, dailyUnit, workingDays, startDate) {
  if (!totalValue || !dailyValue || workingDays.length === 0) {
    return null;
  }

  const totalHours = convertToHours(totalValue, totalUnit);
  const hoursPerDay = convertToHours(dailyValue, dailyUnit);

  const totalWorkdays = totalHours / hoursPerDay;
  const totalWorkdaysFormatted = Number(totalWorkdays.toFixed(1));
  
  let currentDate = parseDate(startDate);
  let remainingWorkdays = totalWorkdays;
  let workdaysCount = 0;
  
  while (remainingWorkdays > 0) {
    const dayOfWeek = currentDate.getDay();
    
    if (workingDays.includes(dayOfWeek)) {
      remainingWorkdays -= 1;
      workdaysCount += 1;
    }
    
    if (remainingWorkdays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  const finishDate = new Date(currentDate);
  const start = parseDate(startDate);
  const calendarDays = Math.floor((finishDate - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const weeks = Math.floor(calendarDays / 7);
  const remainingDays = calendarDays % 7;
  
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
    startDate: start,
    startDateString: formatDateToYYYYMMDD(start),
    finishDateString: formatDateToYYYYMMDD(finishDate),
    workingDaysArray: generateWorkingDaysArray(start, finishDate, workingDays),
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