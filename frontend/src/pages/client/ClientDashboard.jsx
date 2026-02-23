import React, { useState, useEffect } from 'react'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import { orderAPI } from '../../api'

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'status-pending' },
  processing: { label: 'Processing', className: 'status-pending' },
  dispatched: { label: 'Dispatched', className: 'status-active' },
  delivered: { label: 'Delivered', className: 'status-active' },
  delivery_failed: { label: 'Failed', className: 'status-inactive' },
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ delivery_address: '', product_id: 1 })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await orderAPI.getMyOrders()
      setOrders(res.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.delivery_address.trim()) {
      setError('Delivery address is required')
      return
    }
    try {
      setSubmitting(true)
      await orderAPI.submitOrder({
        delivery_address: form.delivery_address,
        product_id: form.product_id
      })
      setSuccess('Order submitted successfully!')
      setForm({ delivery_address: '', product_id: 1 })
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit order')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatus = (status) => STATUS_CONFIG[status] || { label: status, className: 'status-pending' }

  const totalOrders = orders.length
  const activeOrders = orders.filter(o => !['delivered', 'delivery_failed'].includes(o.status)).length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <div className="page-title">Welcome, {user?.username}</div>
        <div className="page-subtitle">Manage your deliveries and track orders</div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{totalOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{deliveredOrders}</div>
          </div>
        </div>

        {/* New Order Form */}
        <div className="table-wrapper" style={{ marginBottom: 24 }}>
          <div className="table-header">
            <div className="table-title">
              <span style={{ marginRight: 8 }}>📦</span>
              Place New Order
            </div>
          </div>
          <div style={{ padding: '22px' }}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmitOrder}>
              <div className="form-group">
                <label htmlFor="delivery_address">Delivery Address</label>
                <input
                  id="delivery_address"
                  type="text"
                  placeholder="Enter delivery address"
                  value={form.delivery_address}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : null}
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-wrapper">
          <div className="table-header">
            <div className="table-title">
              <span style={{ marginRight: 8 }}>📋</span>
              My Orders
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
                <th>Driver</th>
                <th>Status</th>
                <th>Created</th>
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
                    No orders yet. Place your first order above!
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const st = getStatus(order.status)
                  return (
                    <tr key={order.order_id}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                        #{order.order_id}
                      </td>
                      <td>{order.delivery_address || '—'}</td>
                      <td className="td-muted">
                        {order.driver_id ? `Driver #${order.driver_id}` : 'Unassigned'}
                      </td>
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