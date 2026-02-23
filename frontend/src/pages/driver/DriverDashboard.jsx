import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { driverAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { getStatusMeta, STATUS_META } from '../../lib/status'

/* ── Icons ── */
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
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
const IconPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)



function SkeletonCard() {
  return (
    <div className="stat-card-v2" style={{ gap: 16 }}>
      <div style={{ width: 50, height: 50, borderRadius: 13, background: 'var(--bg-surface)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ width: 48, height: 28, borderRadius: 6, background: 'var(--bg-surface)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--bg-surface)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="recent-order-row" style={{ pointerEvents: 'none' }}>
      <div style={{ width: 36, height: 13, borderRadius: 4, background: 'var(--bg-surface)' }} />
      <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'var(--bg-surface)' }} />
      <div style={{ width: 60, height: 20, borderRadius: 20, background: 'var(--bg-surface)' }} />
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DriverDashboard() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getMyJobs()
      setJobs(Array.isArray(res.data) ? res.data : [])
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const total     = jobs.length
  const assigned  = jobs.filter(j => j.status?.toLowerCase() === 'assigned').length
  const delivered = jobs.filter(j => j.status?.toLowerCase() === 'delivered').length
  const failed    = jobs.filter(j => j.status?.toLowerCase() === 'failed').length
  const pending   = jobs.filter(j => j.status?.toLowerCase() === 'pending').length
  const recentJobs = jobs.slice().reverse().slice(0, 8)

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">

        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Driver Dashboard</h1>
            <p className="admin-page-subtitle">
              {greeting()}, {user?.username} — here's your delivery overview.
            </p>
          </div>
          <div className="admin-topbar-actions">
            <button
              className="btn-icon-outline"
              onClick={() => load()}
              aria-label="Refresh"
              title="Refresh"
            >
              <IconRefresh />
            </button>
            <button className="btn-accent" onClick={() => navigate('/driver/jobs')}>
              <IconTruck /> View Jobs
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <div
                className="stat-card-v2"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/driver/jobs')}
              >
                <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
                  <IconPackage />
                </div>
                <div>
                  <div className="stat-card-value">{total || '—'}</div>
                  <div className="stat-card-label">Total Jobs</div>
                </div>
              </div>

              <div
                className="stat-card-v2"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/driver/jobs', { state: { filter: 'assigned' } })}
              >
                <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  <IconTruck />
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: '#818cf8' }}>{assigned}</div>
                  <div className="stat-card-label">Assigned</div>
                </div>
              </div>

              <div
                className="stat-card-v2"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/driver/jobs', { state: { filter: 'delivered' } })}
              >
                <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                  <IconCheck />
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: '#4ade80' }}>{delivered}</div>
                  <div className="stat-card-label">Delivered</div>
                </div>
              </div>

              <div
                className="stat-card-v2"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/driver/jobs', { state: { filter: 'failed' } })}
              >
                <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                  <IconXCircle />
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: '#f87171' }}>{failed}</div>
                  <div className="stat-card-label">Failed</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Dashboard Grid ── */}
        <div className="dashboard-grid">

          {/* Recent jobs */}
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                Recent Jobs
              </span>
              <button className="dash-view-all" onClick={() => navigate('/driver/jobs')}>
                View all <IconArrow />
              </button>
            </div>

            {loading ? (
              <div className="recent-orders-list">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="table-empty" style={{ padding: '52px 20px', textAlign: 'center' }}>
                <div style={{ marginBottom: 12, opacity: 0.35 }}><IconPackage /></div>
                <div style={{ marginBottom: 6 }}>No jobs assigned yet.</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Jobs will appear here once dispatched to you.
                </div>
              </div>
            ) : (
              <div className="recent-orders-list">
                {recentJobs.map(job => {
                  const meta = getStatusMeta(job.status)
                  return (
                    <div
                      key={job.order_id}
                      className="recent-order-row"
                      onClick={() => navigate('/driver/jobs')}
                    >
                      <div className="recent-order-id">#{job.order_id}</div>
                      <div className="recent-order-addr">{job.delivery_address || '—'}</div>
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
            )}
          </div>

          {/* Status breakdown */}
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                Status Breakdown
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-surface)' }} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'assigned',  count: assigned,  label: 'Assigned',  meta: STATUS_META.assigned  },
                  { key: 'delivered', count: delivered, label: 'Delivered', meta: STATUS_META.delivered },
                  { key: 'pending',   count: pending,   label: 'Pending',   meta: STATUS_META.pending   },
                  { key: 'failed',    count: failed,    label: 'Failed',    meta: STATUS_META.failed    },
                ].map(item => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: item.meta.bg,
                        border: `1px solid ${item.meta.color}22`,
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate('/driver/jobs', { state: { filter: item.key } })}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                          <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: item.meta.color }}>
                            {item.count}
                          </span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: item.meta.color,
                              borderRadius: 2,
                              transition: 'width 0.4s ease',
                              opacity: 0.75,
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: item.meta.color, fontFamily: 'var(--font-display)', fontWeight: 600, flexShrink: 0 }}>
                        {pct}%
                      </span>
                    </div>
                  )
                })}

                {total === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
                    No data available yet.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}