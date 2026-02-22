import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { adminAPI } from '../../api'

export default function CreateDriver() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', vehicle_plate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Username and password are required.'); return }
    setLoading(true); setError('')
    try {
      await adminAPI.createDriver(form)
      setSuccess(`Driver "${form.username}" created successfully!`)
      setForm({ username: '', email: '', password: '', phone: '', vehicle_plate: '' })
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Failed to create driver.')
    } finally { setLoading(false) }
  }

  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <button className="btn-secondary" style={{ marginBottom: 24 }} onClick={() => navigate('/admin/dashboard')}>← Back</button>
        <div className="page-title">Create Driver Account</div>
        <div className="page-subtitle">Register a new delivery driver on SwiftTrack</div>
        <div style={{ maxWidth: 480 }}>
          <div className="card">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Username *</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="e.g. driver_kamal" autoFocus />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="driver@swiftlogistics.lk" />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+94 77 123 4567" />
              </div>
              <div className="form-group">
                <label>Vehicle Plate</label>
                <input name="vehicle_plate" value={form.vehicle_plate} onChange={handleChange} placeholder="e.g. WP CAB-1234" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating…</> : 'Create Driver'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}