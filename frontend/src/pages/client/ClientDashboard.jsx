import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
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
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setOrders([])
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
    <div className="admin-layout">
      <Sidebar role="client" />
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Welcome back, {user?.username} — manage your deliveries and track orders.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
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
              <div className="stat-card-value">{loading ? '—' : totalOrders}</div>
              <div className="stat-card-label">Total Orders</div>
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
              <div className="stat-card-value" style={{ color: '#eab308' }}>{loading ? '—' : activeOrders}</div>
              <div className="stat-card-label">Active</div>
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
              <div className="stat-card-value" style={{ color: '#4ade80' }}>{loading ? '—' : deliveredOrders}</div>
              <div className="stat-card-label">Delivered</div>
            </div>
          </div>
        </div>

        {/* New Order Form */}
        <div className="admin-card" style={{ margin: '0 36px 24px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              📦 Place New Order
            </span>
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
                <button type="submit" className="btn-accent" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : null}
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              📋 My Orders
            </span>
            <button className="btn-outline-accent" onClick={fetchOrders} style={{ fontSize: 12, padding: '6px 14px' }}>
              ↻ Refresh
            </button>
          </div>
          <table className="admin-table">
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
                    <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading orders…
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
      </div>
    </div>
  )
}