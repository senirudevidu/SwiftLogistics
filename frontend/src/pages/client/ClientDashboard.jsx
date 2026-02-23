import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientSidebar from '../../components/ClientSidebar'
import { orderAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

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
const IconPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconXCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const STATUS_META = {
  pending:   { bg: 'rgba(234,179,8,0.12)',  color: '#eab308', label: 'Pending'   },
  assigned:  { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', label: 'Assigned'  },
  delivered: { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', label: 'Delivered' },
  failed:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Failed'    },
}

function getStatusMeta(status) {
  return STATUS_META[status?.toLowerCase()] || { bg: 'rgba(255,255,255,0.06)', color: '#8a8f9e', label: status || '—' }
}

export default function ClientDashboard() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderAPI.getMyOrders()
        setOrders(Array.isArray(res.data) ? res.data : [])
      } catch {
        // endpoint may not be available yet — degrade gracefully
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const total     = orders.length
  const pending   = orders.filter(o => o.status?.toLowerCase() === 'pending').length
  const delivered = orders.filter(o => o.status?.toLowerCase() === 'delivered').length
  const failed    = orders.filter(o => o.status?.toLowerCase() === 'failed').length
  const recentOrders = orders.slice().reverse().slice(0, 8)

  return (
    <div className="admin-layout">
      <ClientSidebar />
      <div className="admin-main">

        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Welcome back, {user?.username} — here's your shipping overview.</p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-accent" onClick={() => navigate('/client/new-order')}>
              <IconPlus /> New Order
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card-v2" style={{ cursor: 'pointer' }} onClick={() => navigate('/client/orders')}>
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
              <IconPackage />
            </div>
            <div>
              <div className="stat-card-value">{loading ? '—' : total}</div>
              <div className="stat-card-label">Total Orders</div>
            </div>
          </div>
          <div
            className="stat-card-v2"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/client/orders', { state: { filter: 'pending' } })}
          >
            <div className="stat-card-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
              <IconClock />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#eab308' }}>{loading ? '—' : pending}</div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>
          <div
            className="stat-card-v2"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/client/orders', { state: { filter: 'delivered' } })}
          >
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              <IconCheck />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#4ade80' }}>{loading ? '—' : delivered}</div>
              <div className="stat-card-label">Delivered</div>
            </div>
          </div>
          <div
            className="stat-card-v2"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/client/orders', { state: { filter: 'failed' } })}
          >
            <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              <IconXCircle />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: '#f87171' }}>{loading ? '—' : failed}</div>
              <div className="stat-card-label">Failed</div>
            </div>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              Recent Orders
            </span>
            <button className="dash-view-all" onClick={() => navigate('/client/orders')}>
              View all <IconArrow />
            </button>
          </div>

          {loading ? (
            <div className="table-empty">
              <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
              Loading orders…
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="table-empty" style={{ padding: '52px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: 12, opacity: 0.4 }}><IconPackage /></div>
              No orders yet.
              <div style={{ marginTop: 12 }}>
                <button className="btn-accent" onClick={() => navigate('/client/new-order')}>
                  <IconPlus /> Place your first order
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="recent-orders-list">
                {recentOrders.map(o => {
                  const meta = getStatusMeta(o.status)
                  return (
                    <div
                      key={o.order_id}
                      className="recent-order-row"
                      onClick={() => navigate('/client/orders')}
                    >
                      <div className="recent-order-id">#{o.order_id}</div>
                      <div className="recent-order-addr">{o.delivery_address}</div>
                      <span
                        className="status-pill-custom"
                        style={{ background: meta.bg, color: meta.color, flexShrink: 0 }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {total > 0 && (
                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}>
                  <span>{delivered} delivered of {total} total</span>
                  <span>{total > 0 ? Math.round((delivered / total) * 100) : 0}% completion</span>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}