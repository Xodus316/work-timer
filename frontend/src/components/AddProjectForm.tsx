import { useState, type FormEvent } from 'react'
import type { Company } from '../types'

interface Props {
  companies: Company[]
  onAddCompany: (name: string) => Promise<Company>
  onAddProject: (name: string, companyId: number) => Promise<void>
}

const ADD_NEW = '__add_new__'

export default function AddProjectForm({
  companies,
  onAddCompany,
  onAddProject,
}: Props) {
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [addingCompany, setAddingCompany] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleCompanyChange(value: string) {
    if (value === ADD_NEW) {
      setAddingCompany(true)
      setCompanyId('')
    } else {
      setAddingCompany(false)
      setCompanyId(value)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Project name is required')
      return
    }

    setBusy(true)
    try {
      let cid = companyId
      if (addingCompany) {
        const cn = newCompany.trim()
        if (!cn) {
          setError('Company name is required')
          return
        }
        const company = await onAddCompany(cn)
        cid = String(company.id)
        setAddingCompany(false)
        setNewCompany('')
      }

      if (!cid) {
        setError('Please choose a company')
        return
      }

      await onAddProject(trimmed, Number(cid))
      setName('')
      setCompanyId(cid)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card add-form" onSubmit={handleSubmit}>
      <div className="add-form-row">
        <input
          className="input"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="input"
          value={addingCompany ? ADD_NEW : companyId}
          onChange={(e) => handleCompanyChange(e.target.value)}
        >
          <option value="" disabled>
            Select a company…
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={ADD_NEW}>+ Add new company…</option>
        </select>

        <button className="btn primary" type="submit" disabled={busy}>
          Add project
        </button>
      </div>

      {addingCompany && (
        <div className="add-form-row">
          <input
            className="input"
            placeholder="New company name"
            value={newCompany}
            autoFocus
            onChange={(e) => setNewCompany(e.target.value)}
          />
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </form>
  )
}
