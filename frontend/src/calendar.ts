// Shared month-grid helpers used by both the project and dashboard calendars.

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface MonthView {
  year: number
  month: number // 0-11
}

export function currentMonthView(): MonthView {
  const t = new Date()
  return { year: t.getFullYear(), month: t.getMonth() }
}

export function prevMonth(v: MonthView): MonthView {
  return v.month === 0
    ? { year: v.year - 1, month: 11 }
    : { year: v.year, month: v.month - 1 }
}

export function nextMonth(v: MonthView): MonthView {
  return v.month === 11
    ? { year: v.year + 1, month: 0 }
    : { year: v.year, month: v.month + 1 }
}

/** Day numbers for the month, padded with nulls so the grid starts on Sunday
 * and fills complete weeks. */
export function buildMonthCells(v: MonthView): (number | null)[] {
  const daysInMonth = new Date(v.year, v.month + 1, 0).getDate()
  const leadingBlanks = new Date(v.year, v.month, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** The month's local-time bounds as UTC ISO strings, for the time-entries API. */
export function monthRangeUtc(v: MonthView): { startIso: string; endIso: string } {
  return {
    startIso: new Date(v.year, v.month, 1).toISOString(),
    endIso: new Date(v.year, v.month + 1, 1).toISOString(),
  }
}

export function isToday(v: MonthView, day: number): boolean {
  const now = new Date()
  return (
    now.getFullYear() === v.year &&
    now.getMonth() === v.month &&
    now.getDate() === day
  )
}
