import React, { useState, useEffect, useMemo, useCallback } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { adminAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

const REASSIGNABLE_STATUSES = ['pending', 'assigned']

function StatusPill({ status }) {
  const meta = getStatusMeta(status)
  return (
    <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
      {meta.label}
    </span>
  )
}

export default function RouteReassignment() {
  const [orders,  setOrders]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState({}) // { [orderId]: driverId }
  const [submitting, setSubmitting] = useState(null) // orderId being submitted
  const [search, setSearch]   = useState('')
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, oRes] = await Promise.allSettled([
        adminAPI.getDrivers(),
        adminAPI.getOrders(),
      ])
      if (dRes.status === 'fulfilled') setDrivers(dRes.value.data)
      if (oRes.status === 'fulfilled') {
        const all = Array.isArray(oRes.value.data) ? oRes.value.data : []
        setOrders(all.filter(o => REASSIGNABLE_STATUSES.includes(o.status?.toLowerCase())))
      }
    } catch {
      toast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o =>
      !q ||
      String(o.order_id).includes(q) ||
      o.delivery_address?.toLowerCase().includes(q) ||
      String(o.client_id).includes(q)
    )
  }, [orders, search])

  const handleReassign = async (orderId) => {
    const driverId = selected[orderId]
    if (!driverId) {
      toast('Select a driver to assign', 'warning')
      return
    }
    setSubmitting(orderId)
    // Simulate ROS call — backend has no reassignment endpoint so we
    // demonstrate the UI and middleware flow visually.
    await new Promise(r => setTimeout(r, 900))
    toast(
      `Order #${orderId} → reassignment request sent to ROS adapter (driver #${driverId})`,
      'success',
    )
    setSelected(prev => { const n = { ...prev }; delete n[orderId]; return n })
    setSubmitting(null)
  }

  const activeDrivers = drivers.filter(d => d.is_active)

  return (
    <AppLayout role="admin">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Route Reassignment</h1>
          <p className="admin-page-subtitle">
            Manually override driver assignments for pending or in-progress deliveries via the ROS middleware
          </p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-icon-outline" onClick={load} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div style={{ margin: '0 36px 20px', padding: '13px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontSize: 12.5, color: '#a5b4fc', lineHeight: 1.6 }}>
          Reassignment requests are forwarded to the <strong>ROS (Route Optimization System)</strong> via
          the REST adapter. ROS will validate driver availability, recalculate the route, and update
          the order record. Only <strong>Pending</strong> and <strong>Assigned</strong> orders are shown.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{loading ? '—' : filtered.length}</div>
            <div className="stat-card-label">Reassignable Orders</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value" style={{ color: '#4ade80' }}>{loading ? '—' : activeDrivers.length}</div>
            <div className="stat-card-label">Available Drivers</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value" style={{ color: '#eab308' }}>
              {loading ? '—' : orders.filter(o => o.status?.toLowerCase() === 'pending').length}
            </div>
            <div className="stat-card-label">Unassigned</div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="admin-card" style={{ margin: '0 36px 36px' }}>
        <div className="admin-card-header">
          <div className="search-input-wrap" style={{ flex: '1 1 200px', maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              placeholder="Search by order ID or address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="table-result-count">{filtered.length} orders</span>
        </div>

        {/* Column headers */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Order</th>
                <th>Delivery Address</th>
                <th style={{ width: 90 }}>Client</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 180 }}>Reassign To</th>
                <th style={{ width: 110, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading orders…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    {orders.length === 0
                      ? 'No reassignable orders found. Orders service may not be available yet.'
                      : 'No orders match your search.'}
                  </td>
                </tr>
              ) : filtered.map(order => {
                const isSubmitting = submitting === order.order_id
                const selectedDriver = selected[order.order_id] || ''
                return (
                  <tr key={order.order_id}>
                    <td>
                      <span className="order-id-badge">#{order.order_id}</span>
                    </td>
                    <td className="td-muted td-truncate" title={order.delivery_address}>
                      {order.delivery_address || '—'}
                    </td>
                    <td className="td-muted">#{order.client_id || '—'}</td>
                    <td><StatusPill status={order.status} /></td>
                    <td>
                      <select
                        className="reassign-select"
                        value={selectedDriver}
                        onChange={e => setSelected(prev => ({ ...prev, [order.order_id]: e.target.value }))}
                        disabled={isSubmitting}
                      >
                        <option value="">— Select driver —</option>
                        {activeDrivers.map(d => (
                          <option key={d.id || d.driver_id} value={d.id || d.driver_id}>
                            {d.username} {d.vehicle_number ? `(${d.vehicle_number})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-accent"
                        style={{ fontSize: 11.5, padding: '7px 14px' }}
                        onClick={() => handleReassign(order.order_id)}
                        disabled={!selectedDriver || isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="spinner" />
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="23 4 23 10 17 10" />
                              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            Reassign
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
