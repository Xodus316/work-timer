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
