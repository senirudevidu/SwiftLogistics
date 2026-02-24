import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { adminAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { getInitials } from '../../lib/utils'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
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
const IconPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)



export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [drivers, setDrivers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersUnavailable, setOrdersUnavailable] = useState(false)
  const [activeTab, setActiveTab] = useState('clients')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, dRes] = await Promise.all([adminAPI.getClients(), adminAPI.getDrivers()])
        setClients(cRes.data)
        setDrivers(dRes.data)
      } catch {
        toast('Failed to load users', 'error')
      }
      try {
        const oRes = await adminAPI.getOrders()
        setOrders(Array.isArray(oRes.data) ? oRes.data : [])
      } catch (err) {
        if (err?.response?.status === 404) {
          setOrdersUnavailable(true) // gateway route not yet implemented
        }
        // all other errors silently degrade — orders are non-critical here
      }
      setLoading(false)
    }
    load()
  }, [])

  const activeUsers = [...clients, ...drivers].filter(u => u.is_active).length
  const deliveredCount = orders.filter(o => o.status?.toLowerCase() === 'delivered').length
  const recentOrders = orders.slice().reverse().slice(0, 8)

  const filteredClients = clients.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredDrivers = drivers.filter(d =>
    d.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.vehicle_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-layout">
      <Sidebar role="admin" />
      <div className="admin-main">

        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Welcome back — here's what's happening today.</p>
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

        {/* ── Stats ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card-v2" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/clients')}>
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
              <IconUsers />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : clients.length}</div>
              <div className="stat-card-label">Total Clients</div>
            </div>
          </div>
          <div className="stat-card-v2" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/drivers')}>
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
          <div className="stat-card-v2" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')}>
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.10)', color: '#fb923c' }}>
              <IconPackage />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : orders.length || '—'}</div>
              <div className="stat-card-label">Total Orders</div>
            </div>
          </div>
        </div>

        {/* ── Two-column grid: users table + recent orders ── */}
        <div className="dashboard-grid">

          {/* Users table */}
          <div className="admin-card" style={{ margin: 0 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="search-input-wrap" style={{ minWidth: 180 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input className="search-input" placeholder={`Search ${activeTab}…`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button
                  className="dash-view-all"
                  onClick={() => navigate(activeTab === 'clients' ? '/admin/clients' : '/admin/drivers')}
                >
                  View all <IconArrow />
                </button>
              </div>
            </div>

            {activeTab === 'clients' ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="table-empty">Loading…</td></tr>
                  ) : filteredClients.length === 0 ? (
                    <tr><td colSpan="3" className="table-empty">{search ? 'No results.' : 'No clients yet.'}</td></tr>
                  ) : filteredClients.slice(0, 8).map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="table-avatar" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent)' }}>
                            {getInitials(c.name || c.username)}
                          </div>
                          <div style={{ lineHeight: 1.4 }}>
                            <span className="table-username">{c.name || c.username}</span>
                            {c.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{c.username}</div>}
                          </div>
                        </div>
                      </td>
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
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="table-empty">Loading…</td></tr>
                  ) : filteredDrivers.length === 0 ? (
                    <tr><td colSpan="3" className="table-empty">{search ? 'No results.' : 'No drivers yet.'}</td></tr>
                  ) : filteredDrivers.slice(0, 8).map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="table-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                            {getInitials(d.name || d.username)}
                          </div>
                          <div style={{ lineHeight: 1.4 }}>
                            <span className="table-username">{d.name || d.username}</span>
                            {d.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{d.username}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{d.vehicle_number || '—'}</td>
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

          {/* Recent orders */}
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Recent Orders</span>
              <button className="dash-view-all" onClick={() => navigate('/admin/orders')}>
                View all <IconArrow />
              </button>
            </div>
            {ordersUnavailable ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '36px 20px', gap: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)',
                }}>
                  <IconPackage />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>
                    Orders not yet connected
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    GET /orders is not yet implemented in the gateway
                  </div>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="table-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                {loading ? 'Loading…' : 'No orders yet.'}
              </div>
            ) : (
              <div className="recent-orders-list">
                {recentOrders.map(o => {
                  const meta = getStatusMeta(o.status)
                  return (
                    <div key={o.order_id} className="recent-order-row" onClick={() => navigate('/admin/orders')}>
                      <div className="recent-order-id">#{o.order_id}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="recent-order-addr">{o.delivery_address}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {o.client_name || o.client_username || 'Unknown'} (ID: {o.client_id})
                          {o.driver_id ? ` → ${o.driver_name || o.driver_username || 'Unknown'} (ID: ${o.driver_id})` : ''}
                        </div>
                      </div>
                      <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, flexShrink: 0 }}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {orders.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{deliveredCount} delivered of {orders.length} total</span>
                <span>{orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0}% completion</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
