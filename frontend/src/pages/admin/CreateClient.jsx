import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { adminAPI } from '../../api'

const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

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
    setLoading(true); setError(''); setSuccess('')
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
    <div className="admin-layout">
      <Sidebar role="admin" />
      <div className="admin-main">

        <div className="admin-topbar">
          <div>
            <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
              <IconArrowLeft /> Back to Dashboard
            </button>
            <h1 className="admin-page-title" style={{ marginTop: 10 }}>Create Client</h1>
            <p className="admin-page-subtitle">Add a new e-commerce client to SwiftLogistics</p>
          </div>
        </div>

        <div className="form-page-grid">
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <IconUser />
              </div>
              <div>
                <div className="form-card-title">Account Details</div>
                <div className="form-card-subtitle">Fill in the client's information below</div>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
              <div className="alert alert-success">
                <IconCheck /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name <span className="required-star">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Perera" autoFocus />
                </div>
                <div className="form-group">
                  <label>Username <span className="required-star">*</span></label>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="e.g. shopone_lk" />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="client@company.com" />
              </div>
              <div className="form-group">
                <label>Password <span className="required-star">*</span></label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/admin/dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent" disabled={loading}>
                  {loading ? <><span className="spinner" /> Creating…</> : 'Create Client'}
                </button>
              </div>
            </form>
          </div>

          <div className="form-info-panel">
            <div className="info-panel-title">About Clients</div>
            <ul className="info-panel-list">
              <li>Clients are e-commerce businesses that use SwiftLogistics for parcel delivery.</li>
              <li>They can place orders and track shipments through their own dashboard.</li>
              <li>Client accounts are immediately active after creation.</li>
              <li>An email address is optional but recommended for notifications.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
