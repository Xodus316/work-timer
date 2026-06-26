import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { Project, Task } from '../types'
import TaskRow from '../components/TaskRow'
import TaskForm from '../components/TaskForm'
import { notifyTimerChange } from '../timerEvents'

interface Baseline {
  elapsed: number
  at: number
}

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const id = Number(projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Re-render once per second while any timer is running.
  const [, setTick] = useState(0)
  // Per-task baseline captured at fetch time so the live tick uses the client clock.
  const baselines = useRef<Record<number, Baseline>>({})

  function captureBaselines(list: Task[]) {
    const now = Date.now()
    const map: Record<number, Baseline> = {}
    for (const t of list) {
      map[t.id] = { elapsed: t.elapsed_seconds, at: now }
    }
    baselines.current = map
  }

  async function loadTasks() {
    const t = await api.listTasks(id)
    setTasks(t)
    captureBaselines(t)
  }

  async function load() {
    try {
      const [p, t] = await Promise.all([api.getProject(id), api.listTasks(id)])
      setProject(p)
      setTasks(t)
      captureBaselines(t)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!tasks.some((t) => t.is_running)) return
    const interval = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [tasks])

  function displaySeconds(task: Task): number {
    if (!task.is_running) return task.elapsed_seconds
    const base = baselines.current[task.id]
    if (!base) return task.elapsed_seconds
    return base.elapsed + Math.floor((Date.now() - base.at) / 1000)
  }

  async function runAction(fn: () => Promise<unknown>) {
    try {
      await fn()
      // The single-timer rule may have stopped another task, so refetch all.
      await loadTasks()
      // Refresh the tab title immediately (don't wait for its background poll).
      notifyTimerChange()
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleStart(task: Task) {
    return runAction(() => api.startTask(task.id))
  }

  function handleStop(task: Task) {
    return runAction(() => api.stopTask(task.id))
  }

  function handleComplete(task: Task) {
    return runAction(() => api.completeTask(task.id))
  }

  function handleReopen(task: Task) {
    return runAction(() => api.reopenTask(task.id))
  }

  function handleAdd(name: string, description: string) {
    return runAction(() => api.createTask(id, name, description))
  }

  function handleUpdate(task: Task, name: string, description: string) {
    return runAction(() =>
      api.updateTask(task.id, { name, description: description || null }),
    )
  }

  function handleDelete(task: Task) {
    if (!window.confirm('Delete this task?')) return
    void runAction(() => api.deleteTask(task.id))
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← All projects
      </Link>

      <h1>{project?.name ?? 'Project'}</h1>
      {project && <p className="subtitle">{project.company_name}</p>}

      <TaskForm onSubmit={handleAdd} submitLabel="Add task" />

      {error && <p className="error">{error}</p>}

      {tasks.length === 0 ? (
        <p className="empty">No tasks yet. Add one above to start timing.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              seconds={displaySeconds(t)}
              onStart={() => handleStart(t)}
              onStop={() => handleStop(t)}
              onComplete={() => handleComplete(t)}
              onReopen={() => handleReopen(t)}
              onUpdate={(name, desc) => handleUpdate(t, name, desc)}
              onDelete={() => handleDelete(t)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
