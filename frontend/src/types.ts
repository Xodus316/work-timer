export interface Company {
  id: number
  name: string
}

export interface Project {
  id: number
  name: string
  company_id: number
  company_name: string
  created_at: string
}

export interface Task {
  id: number
  project_id: number
  name: string
  description: string | null
  total_seconds: number
  elapsed_seconds: number
  is_running: boolean
  completed: boolean
  created_at: string
}

export interface TimeEntry {
  id: number
  task_id: number
  seconds: number
  started_at: string // ISO-8601 UTC
  ended_at: string // ISO-8601 UTC
}
