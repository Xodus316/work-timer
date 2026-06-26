// Fired after any timer-affecting action so the tab title re-syncs immediately
// (otherwise it would wait for the next background poll).
export const TIMER_CHANGE_EVENT = 'timerchange'

export function notifyTimerChange() {
  window.dispatchEvent(new Event(TIMER_CHANGE_EVENT))
}
