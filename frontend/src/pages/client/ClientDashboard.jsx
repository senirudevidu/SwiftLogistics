import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { orderAPI } from '../../api'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

export default function ClientDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await orderAPI.getMyOrders()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast('Failed to load orders', 'error')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const totalOrders = orders.length
  const activeOrders = orders.filter(o => !['delivered', 'delivery_failed'].includes(o.status)).length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  return (
    <div className="admin-layout">
      <Sidebar role="client" />
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Welcome back, {user?.username} — manage your deliveries and track orders.</p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-icon-outline" onClick={fetchOrders} aria-label="Refresh" title="Refresh">
              <IconRefresh />
            </button>
            <button className="btn-accent" onClick={() => navigate('/client/new-order')}>
              <IconPlus /> New Order
            </button>
          </div>
        </div>

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

        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>My Orders</span>
            <button
              className="btn-accent"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => navigate('/client/orders')}
            >
              View all orders
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
                    No orders yet. Place your first order using the button above!
                  </td>
                </tr>
              ) : (
                orders.slice().reverse().slice(0, 8).map((order) => {
                  const meta = getStatusMeta(order.status)
                  return (
                    <tr key={order.order_id}>
                      <td>
                        <span className="order-id-badge">#{order.order_id}</span>
                      </td>
                      <td className="td-muted td-truncate" title={order.delivery_address}>
                        {order.delivery_address || '—'}
                      </td>
                      <td className="td-muted">
                        {order.driver_id ? `Driver #${order.driver_id}` : 'Unassigned'}
                      </td>
                      <td>
                        <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="td-muted">{formatDate(order.created_at)}</td>
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

