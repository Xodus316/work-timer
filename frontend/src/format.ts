export function formatHMS(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`
}

/** Compact "2h 5m" style for daily/monthly totals. Empty string for 0. */
export function formatHours(total: number): string {
  const s = Math.max(0, Math.floor(total))
  if (s === 0) return ''
  let hours = Math.floor(s / 3600)
  let mins = Math.round((s % 3600) / 60)
  if (mins === 60) {
    hours += 1
    mins = 0
  }
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (mins > 0) parts.push(`${mins}m`)
  return parts.length ? parts.join(' ') : '<1m'
}
