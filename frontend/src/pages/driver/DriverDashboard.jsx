import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { driverAPI } from '../../api'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

const canAct = (status) => {
  const s = status?.toLowerCase()
  return s === 'assigned' || s === 'dispatched'
}

export default function DriverDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await driverAPI.getMyJobs()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast('Failed to load your orders. Make sure you are registered as a driver.', 'error')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleMarkDelivered = async (orderId) => {
    setActionLoading(orderId)
    try {
      await driverAPI.markDelivered(orderId)
      toast(`Order #${orderId} marked as delivered.`, 'success')
      fetchOrders()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkFailed = async (orderId) => {
    setActionLoading(orderId)
    try {
      await driverAPI.markFailed(orderId)
      toast(`Order #${orderId} marked as delivery failed.`, 'warning')
      fetchOrders()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const totalAssigned = orders.length
  const pendingDelivery = orders.filter(o => !['delivered', 'delivery_failed'].includes(o.status)).length
  const completedDeliveries = orders.filter(o => o.status === 'delivered').length
  const failedDeliveries = orders.filter(o => o.status === 'delivery_failed').length

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Driver Portal</h1>
            <p className="admin-page-subtitle">Your delivery manifest and status for today, {user?.username}</p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-icon-outline" onClick={fetchOrders} aria-label="Refresh" title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>

        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : totalAssigned}</div>
              <div className="stat-card-label">Assigned</div>
            </div>
          </div>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#eab308' }}>{loading ? '—' : pendingDelivery}</div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#4ade80' }}>{loading ? '—' : completedDeliveries}</div>
              <div className="stat-card-label">Delivered</div>
            </div>
          </div>
          <div className="stat-card-v2">
            <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#f87171' }}>{loading ? '—' : failedDeliveries}</div>
              <div className="stat-card-label">Failed</div>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>My Deliveries</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Delivery Address</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading deliveries…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">No deliveries assigned to you yet.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const meta = getStatusMeta(order.status)
                  const isActionLoading = actionLoading === order.order_id
                  const actionable = canAct(order.status)
                  return (
                    <tr key={order.order_id}>
                      <td>
                        <span className="order-id-badge">#{order.order_id}</span>
                      </td>
                      <td className="td-muted">{order.delivery_address || '—'}</td>
                      <td>
                        <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="td-muted">{formatDate(order.created_at)}</td>
                      <td>
                        {actionable ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-accent"
                              style={{ fontSize: 11, padding: '6px 14px' }}
                              onClick={() => handleMarkDelivered(order.order_id)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? <span className="spinner" /> : '✓ Delivered'}
                            </button>
                            <button
                              className="btn-danger-outline"
                              style={{ fontSize: 11, padding: '6px 14px' }}
                              onClick={() => handleMarkFailed(order.order_id)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? <span className="spinner" /> : '✗ Failed'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {order.status === 'delivered'
                              ? '✓ Completed'
                              : order.status === 'delivery_failed'
                                ? '✗ Failed'
                                : 'Awaiting dispatch'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

