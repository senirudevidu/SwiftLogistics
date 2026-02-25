import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

/* ── Icons ── */
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconTruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

export default function RouteView() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const { toast }             = useToast()
  const navigate              = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getMyJobs()
      setJobs(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast('Failed to load route data.', 'error')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const activeJobs = jobs.filter(j =>
    ['assigned', 'dispatched'].includes(j.status?.toLowerCase())
  )
  const completed = jobs.filter(j => j.status?.toLowerCase() === 'delivered').length
  const total     = jobs.length

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">

        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Route View</h1>
            <p className="admin-page-subtitle">
              {loading ? 'Loading…' : `${activeJobs.length} stop${activeJobs.length !== 1 ? 's' : ''} remaining on today's route`}
            </p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
              <IconRefresh />
            </button>
            <button className="btn-accent" onClick={() => navigate('/driver/proof-of-delivery')}>
              Submit POD
            </button>
          </div>
        </div>

        {/* ── Progress ── */}
        {!loading && total > 0 && (
          <div style={{ padding: '0 36px 20px' }}>
            <div className="route-progress-wrap">
              <div className="route-progress-header">
                <span>Delivery Progress</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {completed} / {total} complete · {Math.round((completed / total) * 100)}%
                </span>
              </div>
              <div className="route-progress-bar">
                <div
                  className="route-progress-fill"
                  style={{ width: `${Math.round((completed / total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Stop list ── */}
        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              Active Stops
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
              {activeJobs.length} remaining
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" /> Loading route…
            </div>
          ) : activeJobs.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Route complete!
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                No remaining stops on your route.
              </div>
            </div>
          ) : (
            <div>
              {activeJobs.map((job, idx) => {
                const meta = getStatusMeta(job.status)
                return (
                  <div
                    key={job.order_id}
                    className="activity-item"
                    style={{ padding: '16px 22px', cursor: 'pointer' }}
                    onClick={() => navigate('/driver/jobs')}
                  >
                    {/* Stop number */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 12,
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>

                    <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                          Job #{job.order_id}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, fontSize: 10 }}>
                            {meta.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            <IconClock style={{ verticalAlign: 'middle' }} /> {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <IconMapPin />
                        <span className="td-truncate" style={{ maxWidth: 480 }}>
                          {job.delivery_address || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Completed stops ── */}
        {!loading && completed > 0 && (
          <div className="admin-card" style={{ margin: '0 36px 36px' }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                Completed Stops
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#4ade80' }}>
                {completed} delivered
              </span>
            </div>
            {jobs
              .filter(j => j.status?.toLowerCase() === 'delivered')
              .map(job => (
                <div key={job.order_id} className="activity-item" style={{ padding: '14px 22px', opacity: 0.65 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(74,222,128,0.15)',
                    color: '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconCheck />
                  </div>
                  <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                        Job #{job.order_id}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(job.updated_at || job.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconMapPin />
                      <span className="td-truncate" style={{ maxWidth: 480 }}>
                        {job.delivery_address || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── No jobs at all ── */}
        {!loading && total === 0 && (
          <div style={{ padding: '60px 36px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
              <IconTruck />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              No jobs assigned yet
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Jobs will appear here once dispatched by the system.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
