import { useState, type FormEvent } from 'react'

interface Props {
  initialName?: string
  initialDescription?: string
  submitLabel: string
  onSubmit: (name: string, description: string) => Promise<void> | void
  onCancel?: () => void
}

export default function TaskForm({
  initialName = '',
  initialDescription = '',
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const isEditing = initialName !== ''
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Task name is required')
      return
    }

    setBusy(true)
    try {
      await onSubmit(trimmed, description.trim())
      if (!isEditing) {
        setName('')
        setDescription('')
      }
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="Task name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="btn primary" type="submit" disabled={busy}>
        {submitLabel}
      </button>
      {onCancel && (
        <button className="btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
      {error && <span className="error inline">{error}</span>}
    </form>
  )
}
