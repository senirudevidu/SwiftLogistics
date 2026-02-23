import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { adminAPI } from '../../api'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconTruck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const IconActivity = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients')
  const [search, setSearch] = useState('')
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

  const activeUsers = [...clients, ...drivers].filter(u => u.is_active).length

  const filteredClients = clients.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredDrivers = drivers.filter(d =>
    d.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">

        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Overview of your SwiftLogistics platform</p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-outline-accent" onClick={() => navigate('/admin/create-client')}>
              <IconPlus /> New Client
            </button>
            <button className="btn-accent" onClick={() => navigate('/admin/create-driver')}>
              <IconPlus /> New Driver
            </button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
              <IconUsers />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : clients.length}</div>
              <div className="stat-card-label">Total Clients</div>
            </div>
          </div>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <IconTruck />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : drivers.length}</div>
              <div className="stat-card-label">Total Drivers</div>
            </div>
          </div>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              <IconActivity />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : activeUsers}</div>
              <div className="stat-card-label">Active Users</div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === 'clients' ? 'active' : ''}`}
                onClick={() => { setActiveTab('clients'); setSearch('') }}
              >
                Clients
                <span className="admin-tab-count">{clients.length}</span>
              </button>
              <button
                className={`admin-tab ${activeTab === 'drivers' ? 'active' : ''}`}
                onClick={() => { setActiveTab('drivers'); setSearch('') }}
              >
                Drivers
                <span className="admin-tab-count">{drivers.length}</span>
              </button>
            </div>
            <div className="search-input-wrap">
              <IconSearch />
              <input
                className="search-input"
                placeholder={`Search ${activeTab}…`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'clients' ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="table-empty">Loading…</td></tr>
                ) : filteredClients.length === 0 ? (
                  <tr><td colSpan="4" className="table-empty">
                    {search ? 'No clients match your search.' : 'No clients yet. Create the first one!'}
                  </td></tr>
                ) : filteredClients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent)' }}>
                          {getInitials(c.username)}
                        </div>
                        <span className="table-username">{c.username}</span>
                      </div>
                    </td>
                    <td className="td-muted">{c.company_name || '—'}</td>
                    <td className="td-muted">{c.email || '—'}</td>
                    <td>
                      <span className={`status-pill ${c.is_active ? 'status-active' : 'status-inactive'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="table-empty">Loading…</td></tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr><td colSpan="4" className="table-empty">
                    {search ? 'No drivers match your search.' : 'No drivers yet.'}
                  </td></tr>
                ) : filteredDrivers.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                          {getInitials(d.username)}
                        </div>
                        <span className="table-username">{d.username}</span>
                      </div>
                    </td>
                    <td className="td-muted">{d.vehicle_number || '—'}</td>
                    <td className="td-muted">{d.email || '—'}</td>
                    <td>
                      <span className={`status-pill ${d.is_active ? 'status-active' : 'status-inactive'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}