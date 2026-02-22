import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { adminAPI } from '../../api'

export default function CreateClient() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password || !form.name) { setError('Name, username and password are required.'); return }
    setLoading(true); setError('')
    try {
      await adminAPI.createClient(form)
      setSuccess(`Client "${form.username}" created successfully!`)
      setForm({ name: '', username: '', email: '', password: '' })
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Failed to create client.')
    } finally { setLoading(false) }
  }

  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <button className="btn-secondary" style={{ marginBottom: 24 }} onClick={() => navigate('/admin/dashboard')}>← Back</button>
        <div className="page-title">Create Client Account</div>
        <div className="page-subtitle">Add a new e-commerce client to SwiftTrack</div>
        <div style={{ maxWidth: 480 }}>
          <div className="card">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Perera" autoFocus />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="e.g. shopone_lk" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="client@company.com" />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating…</> : 'Create Client'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
