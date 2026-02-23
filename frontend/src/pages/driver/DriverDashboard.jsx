import React, { useState, useEffect } from 'react'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import { driverAPI } from '../../api'

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'status-pending', canUpdate: false },
  processing: { label: 'Processing', className: 'status-pending', canUpdate: false },
  dispatched: { label: 'Dispatched', className: 'status-active', canUpdate: true },
  delivered: { label: 'Delivered', className: 'status-active', canUpdate: false },
  delivery_failed: { label: 'Failed', className: 'status-inactive', canUpdate: false },
}

export default function DriverDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', msg: '' })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await driverAPI.getMyOrders()
      setOrders(res.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setFeedback({ type: 'error', msg: 'Failed to load your orders. Make sure you are registered as a driver.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleMarkDelivered = async (orderId) => {
    setActionLoading(orderId)
    setFeedback({ type: '', msg: '' })
    try {
      await driverAPI.markDelivered(orderId)
      setFeedback({ type: 'success', msg: `Order #${orderId} marked as delivered!` })
      fetchOrders()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Failed to update status' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkFailed = async (orderId) => {
    setActionLoading(orderId)
    setFeedback({ type: '', msg: '' })
    try {
      await driverAPI.markFailed(orderId)
      setFeedback({ type: 'success', msg: `Order #${orderId} marked as delivery failed.` })
      fetchOrders()
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Failed to update status' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatus = (status) => STATUS_CONFIG[status] || { label: status, className: 'status-pending', canUpdate: false }

  const totalAssigned = orders.length
  const pendingDelivery = orders.filter(o => !['delivered', 'delivery_failed'].includes(o.status)).length
  const completedDeliveries = orders.filter(o => o.status === 'delivered').length
  const failedDeliveries = orders.filter(o => o.status === 'delivery_failed').length

  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <div className="page-title">Driver Portal</div>
        <div className="page-subtitle">Your delivery manifest and status for today, {user?.username}</div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Assigned</div>
            <div className="stat-value">{totalAssigned}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Delivery</div>
            <div className="stat-value">{pendingDelivery}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{completedDeliveries}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value">{failedDeliveries}</div>
          </div>
        </div>

        {/* Feedback */}
        {feedback.msg && (
          <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {feedback.msg}
          </div>
        )}

        {/* Orders Table */}
        <div className="table-wrapper">
          <div className="table-header">
            <div className="table-title">
              <span style={{ marginRight: 8 }}>🚚</span>
              My Deliveries
            </div>
            <button className="btn-secondary" onClick={fetchOrders} style={{ fontSize: 12, padding: '6px 14px' }}>
              ↻ Refresh
            </button>
          </div>
          <table>
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
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No deliveries assigned to you yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const st = getStatus(order.status)
                  const isActionLoading = actionLoading === order.order_id
                  return (
                    <tr key={order.order_id}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                        #{order.order_id}
                      </td>
                      <td>{order.delivery_address || '—'}</td>
                      <td>
                        <span className={`status-pill ${st.className}`}>{st.label}</span>
                      </td>
                      <td className="td-muted">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                          : '—'}
                      </td>
                      <td>
                        {st.canUpdate ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-primary"
                              style={{ fontSize: 11, padding: '6px 14px', textTransform: 'none', letterSpacing: 0 }}
                              onClick={() => handleMarkDelivered(order.order_id)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? <span className="spinner" /> : '✓ Delivered'}
                            </button>
                            <button
                              className="btn-danger"
                              style={{ fontSize: 11, padding: '6px 14px' }}
                              onClick={() => handleMarkFailed(order.order_id)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? <span className="spinner" /> : '✗ Failed'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {order.status === 'delivered' ? '✓ Completed' :
                              order.status === 'delivery_failed' ? '✗ Failed' :
                                'Awaiting dispatch'}
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
      </main>
    </div>
  )
}