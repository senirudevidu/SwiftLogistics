import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { driverAPI } from '../../api'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const ITruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const ICheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
)
const IDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <polyline points="9 15 11 17 15 13"/>
  </svg>
)
const IUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

/* ── Middleware status strip ─────────────────────────────────────────────── */
const MW_SERVICES = [
  { id: 'cms', label: 'CMS (SOAP)', dot: 'green' },
  { id: 'ros', label: 'ROS (REST)', dot: 'green' },
  { id: 'wms', label: 'WMS (TCP)',  dot: 'green' },
  { id: 'mq',  label: 'MQ Broker', dot: 'green' },
]

function MWStrip({ live, onToggle }) {
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
      <button
        className={`conn-pill ${live ? 'conn-pill--live' : 'conn-pill--paused'}`}
        onClick={onToggle}
        title={live ? 'Click to pause route sync' : 'Click to resume route sync'}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
      >
        <span className="conn-dot" />
        {live ? 'Route Sync Live' : 'Sync Paused'}
      </button>
    </div>
  )
}

/* ── Priority badge ──────────────────────────────────────────────────────── */
function PriorityBadge({ priority }) {
  const p = (priority || 'standard').toLowerCase()
  if (p === 'priority') return <span className="priority-badge priority-badge--high">↑ Priority</span>
  if (p === 'express')  return <span className="priority-badge priority-badge--medium">⚡ Express</span>
  return <span className="priority-badge priority-badge--low">Standard</span>
}

export default function DriverDashboard() {
  const { user }  = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await driverAPI.getMyJobs()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast('Failed to load deliveries. Ensure you are registered as a driver.', 'error')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const activeJobs   = useMemo(() => orders.filter(o => ['assigned', 'dispatched'].includes(o.status?.toLowerCase())), [orders])
  const totalToday   = orders.length
  const completed    = orders.filter(o => o.status?.toLowerCase() === 'delivered').length
  const failed       = orders.filter(o => ['delivery_failed', 'failed'].includes(o.status?.toLowerCase())).length
  const highPriority = activeJobs.filter(o => (o.priority || 'standard').toLowerCase() !== 'standard').length

  const KPI = [
    { label: 'Total Assigned', value: totalToday,       color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)', icon: <ITruck /> },
    { label: 'Active',         value: activeJobs.length, color: '#818cf8',      bg: 'rgba(99,102,241,0.12)', icon: <IClock /> },
    { label: 'Delivered',      value: completed,         color: '#4ade80',      bg: 'rgba(34,197,94,0.12)',  icon: <ICheck /> },
    { label: 'Failed',         value: failed,            color: '#f87171',      bg: 'rgba(239,68,68,0.12)',  icon: <IAlert /> },
  ]

  const QUICK = [
    { label: 'View Manifest',   path: '/driver/jobs',              icon: <ITruck />, color: 'var(--accent)' },
    { label: 'Route View',      path: '/driver/route-view',        icon: <IMapPin />, color: '#818cf8' },
    { label: 'Submit POD',      path: '/driver/proof-of-delivery', icon: <IDoc />,    color: '#4ade80' },
    { label: 'My Profile',      path: '/driver/profile',           icon: <IUser />,   color: 'var(--text-muted)' },
  ]

  return (
    <AppLayout role="driver">
      <MWStrip live={live} onToggle={() => setLive(v => !v)} />

      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Driver Portal</h1>
          <p className="admin-page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {user?.username}
          </p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-icon-outline" onClick={fetchOrders} aria-label="Refresh" title="Refresh">
            <IRefresh />
          </button>
          <button className="btn-accent" onClick={() => navigate('/driver/jobs')}>
            View Manifest
          </button>
        </div>
      </div>

      {/* Urgent strip — only when active jobs exist */}
      {!loading && activeJobs.length > 0 && (
        <div className="urgent-strip">
          <span className="urgent-dot" />
          <span className="urgent-strip-text">
            {activeJobs.length} active deliver{activeJobs.length !== 1 ? 'ies' : 'y'} in progress
            {highPriority > 0 && ` · ${highPriority} high priority`}
          </span>
          <button
            className="btn-accent"
            style={{ fontSize: 11, padding: '4px 12px', marginLeft: 'auto' }}
            onClick={() => navigate('/driver/jobs', { state: { filter: 'assigned' } })}
          >
            View Active
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {KPI.map(k => (
          <div className="stat-card-v2" key={k.label}>
            <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            <div>
              <div className="stat-card-value" style={{ color: k.color }}>{loading ? '—' : k.value}</div>
              <div className="stat-card-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Route progress bar */}
      {!loading && totalToday > 0 && (
        <div className="route-progress-wrap">
          <div className="route-progress-header">
            <span>Delivery Progress</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {completed} / {totalToday} complete · {Math.round((completed / totalToday) * 100)}%
            </span>
          </div>
          <div className="route-progress-bar">
            <div
              className="route-progress-fill"
              style={{ width: `${Math.round((completed / totalToday) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="driver-dash-grid">
        {/* Active deliveries feed */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              Active Deliveries
            </span>
            {live && (
              <span className="sync-indicator">
                <span className="sync-dot" />
                Live
              </span>
            )}
            <button
              className="btn-accent"
              style={{ fontSize: 12, padding: '6px 14px', marginLeft: 'auto' }}
              onClick={() => navigate('/driver/jobs')}
            >
              Full Manifest
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" /> Loading deliveries…
            </div>
          ) : activeJobs.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>All deliveries complete!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No active jobs in your queue.</div>
            </div>
          ) : (
            <div>
              {activeJobs.slice(0, 8).map(job => {
                const meta = getStatusMeta(job.status)
                return (
                  <div
                    key={job.order_id}
                    className="activity-item"
                    style={{ cursor: 'pointer', padding: '14px 22px' }}
                    onClick={() => navigate('/driver/jobs')}
                  >
                    <div
                      className="activity-dot"
                      style={{ background: meta.bg, border: `1px solid ${meta.color}`, flexShrink: 0, marginTop: 4 }}
                    />
                    <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                            Job #{job.order_id}
                          </span>
                          <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, fontSize: 10 }}>
                            {meta.label}
                          </span>
                          <PriorityBadge priority={job.priority} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IPin />
                        <span className="td-truncate" style={{ maxWidth: 340 }}>{job.delivery_address || '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activeJobs.length > 8 && (
                <div
                  style={{ padding: '12px 22px', textAlign: 'center', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, borderTop: '1px solid var(--border)' }}
                  onClick={() => navigate('/driver/jobs')}
                >
                  +{activeJobs.length - 8} more jobs →
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: quick actions + summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Actions
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK.map(a => (
                <button
                  key={a.label}
                  className="quick-action-btn"
                  onClick={() => navigate(a.path)}
                >
                  <span className="quick-action-icon" style={{ background: `rgba(0,0,0,0.2)`, color: a.color }}>
                    {a.icon}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today's Summary
            </div>
            {[
              { label: 'Completion Rate', value: totalToday > 0 ? `${Math.round((completed / totalToday) * 100)}%` : '—', color: '#4ade80' },
              { label: 'Active Jobs',     value: activeJobs.length, color: '#818cf8' },
              { label: 'Failed',          value: failed,            color: failed > 0 ? '#f87171' : 'var(--text-muted)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{loading ? '—' : r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
