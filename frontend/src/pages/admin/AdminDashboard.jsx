import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { adminAPI } from '../../api'

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, dRes] = await Promise.all([adminAPI.getClients(), adminAPI.getDrivers()])
        setClients(cRes.data)
        setDrivers(dRes.data)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <div className="page-title">Admin Dashboard</div>
        <div className="page-subtitle">Manage clients and drivers on the SwiftTrack platform</div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Clients</div>
            <div className="stat-value">{loading ? '—' : clients.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Drivers</div>
            <div className="stat-value">{loading ? '—' : drivers.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{loading ? '—' : [...clients, ...drivers].filter(u => u.is_active).length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button className="btn-primary" onClick={() => navigate('/admin/create-client')}>+ New Client</button>
          <button className="btn-secondary" onClick={() => navigate('/admin/create-driver')}>+ New Driver</button>
        </div>

        <div className="table-wrapper">
          <div className="table-header"><span className="table-title">Clients</span></div>
          <table>
            <thead><tr><th>Username</th><th>Email</th><th>Company</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading…</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No clients yet. Create the first one!</td></tr>
              ) : clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.username}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.company_name || '—'}</td>
                  <td><span className={`status-pill ${c.is_active ? 'status-active' : 'status-inactive'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper">
          <div className="table-header"><span className="table-title">Drivers</span></div>
          <table>
            <thead><tr><th>Username</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading…</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No drivers yet.</td></tr>
              ) : drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.username}</td>
                  <td>{d.email || '—'}</td>
                  <td>{d.phone || '—'}</td>
                  <td><span className={`status-pill ${d.is_active ? 'status-active' : 'status-inactive'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}