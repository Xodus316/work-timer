import { useEffect, useRef } from 'react'
import { api } from '../api'
import { formatHMS } from '../format'
import { TIMER_CHANGE_EVENT } from '../timerEvents'

const DEFAULT_TITLE = 'Work Timer'

interface RunningRef {
  name: string
  elapsed: number
  at: number // client timestamp captured when `elapsed` was read
}

/**
 * Renders nothing. Keeps the browser tab title showing the live elapsed time of
 * the currently running task (across pages and tabs). Polls the server for the
 * running task and ticks the title locally once per second.
 */
export default function TabTimer() {
  const running = useRef<RunningRef | null>(null)

  useEffect(() => {
    let cancelled = false

    function updateTitle() {
      const r = running.current
      if (!r) {
        document.title = DEFAULT_TITLE
        return
      }
      const secs = r.elapsed + Math.floor((Date.now() - r.at) / 1000)
      document.title = `⏱ ${formatHMS(secs)} · ${r.name}`
    }

    async function poll() {
      try {
        const task = await api.getRunningTask()
        if (cancelled) return
        running.current = task
          ? { name: task.name, elapsed: task.elapsed_seconds, at: Date.now() }
          : null
        updateTitle()
      } catch {
        // Network hiccup — keep showing the last known value.
      }
    }

    poll()
    const ticker = window.setInterval(updateTitle, 1000)
    const poller = window.setInterval(poll, 5000)
    window.addEventListener(TIMER_CHANGE_EVENT, poll)

    return () => {
      cancelled = true
      window.clearInterval(ticker)
      window.clearInterval(poller)
      window.removeEventListener(TIMER_CHANGE_EVENT, poll)
      document.title = DEFAULT_TITLE
    }
  }, [])

  return null
}
