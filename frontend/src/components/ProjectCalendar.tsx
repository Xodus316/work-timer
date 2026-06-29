import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatHours } from '../format'
import { TIMER_CHANGE_EVENT } from '../timerEvents'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  projectId: number
}

/**
 * Monthly calendar of hours worked per day on a single project. Sessions are
 * fetched for the visible month and bucketed by their LOCAL start date.
 */
export default function ProjectCalendar({ projectId }: Props) {
  const today = new Date()
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [byDay, setByDay] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Local month window, sent to the server as UTC instants.
      const start = new Date(view.year, view.month, 1)
      const end = new Date(view.year, view.month + 1, 1)
      try {
        const entries = await api.getTimeEntries(
          projectId,
          start.toISOString(),
          end.toISOString(),
        )
        if (cancelled) return
        const buckets: Record<number, number> = {}
        for (const e of entries) {
          const d = new Date(e.started_at)
          if (d.getFullYear() === view.year && d.getMonth() === view.month) {
            buckets[d.getDate()] = (buckets[d.getDate()] ?? 0) + e.seconds
          }
        }
        setByDay(buckets)
        setError(null)
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      }
    }

    load()
    window.addEventListener(TIMER_CHANGE_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(TIMER_CHANGE_EVENT, load)
    }
  }, [projectId, view])

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const leadingBlanks = new Date(view.year, view.month, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const monthTotal = Object.values(byDay).reduce((a, b) => a + b, 0)

  const now = new Date()
  const isCurrentMonth =
    now.getFullYear() === view.year && now.getMonth() === view.month

  function prevMonth() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    )
  }

  function nextMonth() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    )
  }

  function goToday() {
    const t = new Date()
    setView({ year: t.getFullYear(), month: t.getMonth() })
  }

  return (
    <section className="calendar">
      <div className="calendar-header">
        <button className="btn icon" onClick={prevMonth} aria-label="Previous month">
          ‹
        </button>
        <div className="calendar-title">
          <h2>
            {MONTHS[view.month]} {view.year}
          </h2>
          {monthTotal > 0 && (
            <span className="calendar-total">{formatHours(monthTotal)} this month</span>
          )}
        </div>
        <div className="calendar-nav">
          <button className="btn" onClick={goToday}>
            Today
          </button>
          <button className="btn icon" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} className="calendar-day empty" />
          const secs = byDay[d] ?? 0
          const isToday = isCurrentMonth && d === now.getDate()
          return (
            <div
              key={d}
              className={`calendar-day${secs > 0 ? ' worked' : ''}${
                isToday ? ' today' : ''
              }`}
            >
              <span className="calendar-date">{d}</span>
              {secs > 0 && <span className="calendar-hours">{formatHours(secs)}</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
