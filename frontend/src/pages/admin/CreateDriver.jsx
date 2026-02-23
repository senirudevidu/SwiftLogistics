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
const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

export default function CreateDriver() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', vehicle_number: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password || !form.name) { setError('Name, username and password are required.'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminAPI.createDriver(form)
      setSuccess(`Driver "${form.username}" created successfully!`)
      setForm({ name: '', username: '', email: '', password: '', vehicle_number: '' })
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Failed to create driver.')
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
            <h1 className="admin-page-title" style={{ marginTop: 10 }}>Register Driver</h1>
            <p className="admin-page-subtitle">Add a new delivery driver to SwiftLogistics</p>
          </div>
        </div>

        <div className="form-page-grid">
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                <IconTruck />
              </div>
              <div>
                <div className="form-card-title">Driver Details</div>
                <div className="form-card-subtitle">Enter the driver's profile and vehicle information</div>
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
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Kamal Silva" autoFocus />
                </div>
                <div className="form-group">
                  <label>Username <span className="required-star">*</span></label>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="e.g. driver_kamal" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="driver@swiftlogistics.lk" />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} placeholder="e.g. WP CAB-1234" />
                </div>
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
                  {loading ? <><span className="spinner" /> Creating…</> : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>

          <div className="form-info-panel">
            <div className="info-panel-title">About Drivers</div>
            <ul className="info-panel-list">
              <li>Drivers are delivery personnel assigned to shipments each day.</li>
              <li>They receive daily manifests through the driver mobile dashboard.</li>
              <li>The vehicle number is used for route planning and tracking.</li>
              <li>Drivers can mark packages as delivered or flag failed attempts.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
