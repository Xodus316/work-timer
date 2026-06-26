import type { Company, Project, Task } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch {
      // response had no JSON body; keep the status text
    }
    throw new Error(detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  // Companies
  listCompanies: () => request<Company[]>('/api/companies'),
  createCompany: (name: string) =>
    request<Company>('/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteCompany: (id: number) =>
    request<void>(`/api/companies/${id}`, { method: 'DELETE' }),

  // Projects
  listProjects: () => request<Project[]>('/api/projects'),
  getProject: (id: number) => request<Project>(`/api/projects/${id}`),
  createProject: (name: string, companyId: number) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, company_id: companyId }),
    }),
  deleteProject: (id: number) =>
    request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getRunningTask: () => request<Task | null>('/api/tasks/running'),
  listTasks: (projectId: number) =>
    request<Task[]>(`/api/projects/${projectId}/tasks`),
  createTask: (projectId: number, name: string, description?: string) =>
    request<Task>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ name, description: description ?? null }),
    }),
  updateTask: (
    id: number,
    data: { name?: string; description?: string | null },
  ) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  startTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/start`, { method: 'POST' }),
  stopTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/stop`, { method: 'POST' }),
  completeTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/complete`, { method: 'POST' }),
  reopenTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/reopen`, { method: 'POST' }),
}
