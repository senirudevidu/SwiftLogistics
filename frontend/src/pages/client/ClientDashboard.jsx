import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { orderAPI } from '../../api'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

/* ── Icons ────────────────────────────────────────────────────────────────── */
const IPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

/* ── System status strip (mock middleware health) ────────────────────────── */
const MW_SERVICES = [
  { id: 'cms', label: 'CMS (SOAP)',   dot: 'green'  },
  { id: 'ros', label: 'ROS (REST)',   dot: 'green'  },
  { id: 'wms', label: 'WMS (TCP)',    dot: 'green'  },
  { id: 'mq',  label: 'Message Queue', dot: 'green' },
]

function SystemStatusStrip() {
  return (
    <div className="sys-status-strip">
      <span className="sys-status-label">Middleware</span>
      {MW_SERVICES.map(s => (
        <div className="sys-status-item" key={s.id}>
          <span className={`sys-dot sys-dot--${s.dot}`} />
          {s.label}
        </div>
      ))}
      <div className="sys-status-spacer" />
      <div className="sys-status-item" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
        <span className="sys-dot sys-dot--green" />
        All Systems Operational
      </div>
    </div>
  )
}

/* ── Mini bar chart — orders per day (last 7 days) ───────────────────────── */
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function MiniChart({ orders }) {
  const today = new Date()
  const bars = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const count = orders.filter(o => o.created_at?.slice(0, 10) === dateStr).length
      return { day: DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1], count, isToday: i === 6 }
    })
  }, [orders])

  const max = Math.max(...bars.map(b => b.count), 1)

  return (
    <div className="mini-chart-wrap">
      <div className="mini-chart-header">Orders — last 7 days</div>
      <div className="mini-chart-bars">
        {bars.map((b, i) => (
          <div className="mini-chart-col" key={i}>
            <div
              className={`mini-chart-bar ${b.isToday ? 'mini-chart-bar--today' : ''}`}
              style={{ height: `${Math.round((b.count / max) * 100)}%` }}
              title={`${b.day}: ${b.count} order${b.count !== 1 ? 's' : ''}`}
            />
            <div className="mini-chart-day">{b.day}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Activity feed — most recent 8 orders ────────────────────────────────── */
function ActivityFeed({ orders, loading, onViewAll }) {
  if (loading) {
    return (
      <div className="activity-feed">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="activity-item">
            <div className="skeleton" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
              <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div style={{ padding: '40px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          No orders yet
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          Place your first order to see activity here.
        </div>
      </div>
    )
  }

  const recent = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)

  return (
    <>
      <div className="activity-feed">
        {recent.map(order => {
          const meta = getStatusMeta(order.status)
          return (
            <div className="activity-item" key={order.order_id}>
              <div
                className="activity-dot"
                style={{ background: meta.bg, border: `1.5px solid ${meta.color}44` }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </div>
              <div className="activity-body">
                <div className="activity-title">
                  Order #{order.order_id}
                  {order.delivery_address && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                      → {order.delivery_address.slice(0, 32)}{order.delivery_address.length > 32 ? '…' : ''}
                    </span>
                  )}
                </div>
                <div className="activity-sub">{formatDate(order.created_at)}</div>
              </div>
              <div className="activity-badge-wrap">
                <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, fontSize: 10.5 }}>
                  {meta.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '12px 22px 18px', borderTop: '1px solid var(--border)' }}>
        <button
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12.5 }}
          onClick={onViewAll}
        >
          View all orders →
        </button>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ClientDashboard() {
  const { user }    = useAuth()
  const { toast }   = useToast()
  const navigate    = useNavigate()
  const [orders, setOrders]   = useState([])
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

  useEffect(() => { fetchOrders() }, [])

  const total     = orders.length
  const active    = orders.filter(o => !['delivered','delivery_failed','failed'].includes(o.status?.toLowerCase())).length
  const delivered = orders.filter(o => o.status?.toLowerCase() === 'delivered').length
  const failed    = orders.filter(o => ['delivery_failed','failed'].includes(o.status?.toLowerCase())).length

  const KPI_CARDS = [
    {
      label: 'Total Orders',
      value: total,
      color: 'var(--accent)',
      bg: 'rgba(249,115,22,0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      label: 'Active',
      value: active,
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Delivered',
      value: delivered,
      color: '#4ade80',
      bg: 'rgba(34,197,94,0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'Failed',
      value: failed,
      color: '#f87171',
      bg: 'rgba(239,68,68,0.12)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
  ]

  return (
    <AppLayout role="client">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back, <strong>{user?.username}</strong> — here's your delivery overview.
          </p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-icon-outline" onClick={fetchOrders} aria-label="Refresh" title="Refresh">
            <IRefresh />
          </button>
          <button className="btn-accent" onClick={() => navigate('/client/new-order')}>
            <IPlus /> New Order
          </button>
        </div>
      </div>

      {/* ── System status strip ── */}
      <SystemStatusStrip />

      {/* ── KPI row (4 cards) ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {KPI_CARDS.map(k => (
          <div className="stat-card-v2" key={k.label}>
            <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>
              {k.icon}
            </div>
            <div>
              <div className="stat-card-value" style={{ color: k.color }}>
                {loading ? '—' : k.value}
              </div>
              <div className="stat-card-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="dashboard-body-grid">

        {/* ── Activity feed card ── */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              Recent Activity
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {loading ? '…' : `${Math.min(orders.length, 8)} of ${orders.length}`}
            </span>
          </div>
          <ActivityFeed
            orders={orders}
            loading={loading}
            onViewAll={() => navigate('/client/orders')}
          />
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Mini chart */}
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                Order Volume
              </span>
            </div>
            <MiniChart orders={orders} />
          </div>

          {/* Quick actions */}
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                Quick Actions
              </span>
            </div>
            <div className="dashboard-quick-actions">
              {[
                {
                  label: 'Submit New Order',
                  path: '/client/new-order',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  ),
                },
                {
                  label: 'Track an Order',
                  path: '/client/tracking',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ),
                },
                {
                  label: 'View Billing',
                  path: '/client/billing',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  ),
                },
                {
                  label: 'My Profile',
                  path: '/client/profile',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  ),
                },
              ].map(a => (
                <button
                  key={a.path}
                  className="quick-action-btn"
                  onClick={() => navigate(a.path)}
                >
                  <span className="quick-action-icon">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
