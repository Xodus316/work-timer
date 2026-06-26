import { useState } from 'react'
import type { Task } from '../types'
import { formatHMS } from '../format'
import TaskForm from './TaskForm'

interface Props {
  task: Task
  seconds: number
  onStart: () => void
  onStop: () => void
  onComplete: () => void
  onReopen: () => void
  onUpdate: (name: string, description: string) => Promise<void>
  onDelete: () => void
}

export default function TaskRow({
  task,
  seconds,
  onStart,
  onStop,
  onComplete,
  onReopen,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className="task-row editing">
        <TaskForm
          initialName={task.name}
          initialDescription={task.description ?? ''}
          submitLabel="Save"
          onSubmit={async (name, desc) => {
            await onUpdate(name, desc)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li
      className={`task-row${task.is_running ? ' running' : ''}${
        task.completed ? ' completed' : ''
      }`}
    >
      <div className="task-info">
        <span className="task-name">{task.name}</span>
        {task.description && <span className="task-desc">{task.description}</span>}
      </div>

      <span className="task-time">{formatHMS(seconds)}</span>

      <div className="task-actions">
        {task.completed ? (
          <>
            <span className="status-completed">✓ Completed</span>
            <button className="btn" onClick={onReopen}>
              Add more time
            </button>
            <button className="btn danger" onClick={onDelete}>
              Delete
            </button>
          </>
        ) : (
          <>
            {task.is_running ? (
              <button className="btn stop" onClick={onStop}>
                ⏸ Stop
              </button>
            ) : (
              <button className="btn start" onClick={onStart}>
                ▶ Start
              </button>
            )}
            <button className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn complete" onClick={onComplete}>
              Complete
            </button>
            <button className="btn danger" onClick={onDelete}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  )
}
