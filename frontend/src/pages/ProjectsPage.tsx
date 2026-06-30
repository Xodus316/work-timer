import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Company, Project } from '../types'
import AddProjectForm from '../components/AddProjectForm'
import DashboardCalendar from '../components/DashboardCalendar'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [p, c] = await Promise.all([api.listProjects(), api.listCompanies()])
      setProjects(p)
      setCompanies(c)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAddCompany(name: string): Promise<Company> {
    const company = await api.createCompany(name)
    setCompanies((prev) =>
      [...prev, company].sort((a, b) => a.name.localeCompare(b.name)),
    )
    return company
  }

  async function handleAddProject(name: string, companyId: number) {
    await api.createProject(name, companyId)
    await load()
  }

  async function handleDeleteProject(id: number) {
    if (!window.confirm('Delete this project and all of its tasks?')) return
    try {
      await api.deleteProject(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="page">
      <h1>Projects</h1>

      <AddProjectForm
        companies={companies}
        onAddCompany={handleAddCompany}
        onAddProject={handleAddProject}
      />

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="empty">No projects yet. Add one above to get started.</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-row">
              <Link to={`/projects/${p.id}`} className="project-link">
                <span className="project-name">{p.name}</span>
                <span className="badge">{p.company_name}</span>
              </Link>
              <button
                className="btn danger"
                onClick={() => handleDeleteProject(p.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <DashboardCalendar />
    </div>
  )
}
