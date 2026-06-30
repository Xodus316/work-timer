import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatHours } from '../format'
import { TIMER_CHANGE_EVENT } from '../timerEvents'
import {
  buildMonthCells,
  currentMonthView,
  isToday,
  MONTHS,
  monthRangeUtc,
  nextMonth,
  prevMonth,
  WEEKDAYS,
} from '../calendar'

interface ProjectTotal {
  projectId: number
  name: string
  seconds: number
}

/** Monthly calendar of hours per day across ALL projects; each day lists its
 * projects as "<Project> - <time worked>". */
export default function DashboardCalendar() {
  const [view, setView] = useState(currentMonthView())
  const [byDay, setByDay] = useState<Record<number, ProjectTotal[]>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { startIso, endIso } = monthRangeUtc(view)
      try {
        const entries = await api.getAllTimeEntries(startIso, endIso)
        if (cancelled) return
        // day -> projectId -> running total
        const days: Record<number, Record<number, ProjectTotal>> = {}
        for (const e of entries) {
          const d = new Date(e.started_at)
          if (d.getFullYear() !== view.year || d.getMonth() !== view.month) continue
          const day = d.getDate()
          const byProject = (days[day] ??= {})
          const cur = byProject[e.project_id]
          if (cur) {
            cur.seconds += e.seconds
          } else {
            byProject[e.project_id] = {
              projectId: e.project_id,
              name: e.project_name,
              seconds: e.seconds,
            }
          }
        }
        const result: Record<number, ProjectTotal[]> = {}
        for (const [day, byProject] of Object.entries(days)) {
          result[Number(day)] = Object.values(byProject).sort(
            (a, b) => b.seconds - a.seconds,
          )
        }
        setByDay(result)
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
  }, [view])

  const cells = buildMonthCells(view)
  const monthTotal = Object.values(byDay).reduce(
    (sum, list) => sum + list.reduce((s, p) => s + p.seconds, 0),
    0,
  )

  return (
    <section className="calendar dashboard">
      <div className="calendar-header">
        <button
          className="btn icon"
          onClick={() => setView(prevMonth(view))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="calendar-title">
          <h2>
            {MONTHS[view.month]} {view.year}
          </h2>
          {monthTotal > 0 && (
            <span className="calendar-total">
              {formatHours(monthTotal)} across all projects
            </span>
          )}
        </div>
        <div className="calendar-nav">
          <button className="btn" onClick={() => setView(currentMonthView())}>
            Today
          </button>
          <button
            className="btn icon"
            onClick={() => setView(nextMonth(view))}
            aria-label="Next month"
          >
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
          const projects = byDay[d] ?? []
          return (
            <div
              key={d}
              className={`calendar-day${projects.length ? ' worked' : ''}${
                isToday(view, d) ? ' today' : ''
              }`}
            >
              <span className="calendar-date">{d}</span>
              {projects.length > 0 && (
                <ul className="calendar-projects">
                  {projects.map((p) => (
                    <li
                      key={p.projectId}
                      className="calendar-project"
                      title={`${p.name} - ${formatHours(p.seconds)}`}
                    >
                      <span className="calendar-project-name">{p.name}</span>
                      <span className="calendar-project-time">
                        {' - '}
                        {formatHours(p.seconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
