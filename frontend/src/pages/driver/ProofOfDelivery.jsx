import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ConfirmModal from '../../components/ConfirmModal'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'

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
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconDoc = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="9 15 11 17 15 13" />
  </svg>
)

export default function ProofOfDelivery() {
  const [jobs, setJobs]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [actionType, setActionType]     = useState(null) // 'delivered' | 'failed'
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast }                       = useToast()
  const navigate                        = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getMyJobs()
      const all = Array.isArray(res.data) ? res.data : []
      setJobs(all.filter(j => ['assigned', 'dispatched'].includes(j.status?.toLowerCase())))
    } catch {
      toast('Failed to load active jobs.', 'error')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openConfirm = (job, type) => {
    setSelected(job)
    setActionType(type)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!selected || !actionType) return
    setActionLoading(true)
    try {
      if (actionType === 'delivered') {
        await driverAPI.markDelivered(selected.order_id)
        toast(`Job #${selected.order_id} marked as delivered.`, 'success')
      } else {
        await driverAPI.markFailed(selected.order_id)
        toast(`Job #${selected.order_id} marked as failed.`, 'warning')
      }
      setConfirmOpen(false)
      setSelected(null)
      await load()
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        toast('This job is not assigned to you.', 'error')
      } else {
        toast('Failed to update job status. Please try again.', 'error')
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">

        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Proof of Delivery</h1>
            <p className="admin-page-subtitle">
              {loading
                ? 'Loading…'
                : `${jobs.length} active job${jobs.length !== 1 ? 's' : ''} awaiting confirmation`}
            </p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
              <IconRefresh />
            </button>
            <button className="btn-accent" onClick={() => navigate('/driver/jobs')}>
              Full Manifest
            </button>
          </div>
        </div>

        {/* ── Info banner ── */}
        <div style={{ padding: '0 36px 20px' }}>
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <IconDoc />
            <span>
              Select a job below and confirm delivery or report a failed attempt.
              Only <strong>assigned</strong> or <strong>dispatched</strong> jobs can be updated.
            </span>
          </div>
        </div>

        {/* ── Job cards ── */}
        <div style={{ padding: '0 36px 36px' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" /> Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div className="admin-card" style={{ margin: 0, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                All deliveries confirmed!
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                No active jobs require a POD update right now.
              </div>
              <button
                className="btn-accent"
                style={{ marginTop: 20 }}
                onClick={() => navigate('/driver/jobs')}
              >
                View All Jobs
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => {
                const meta    = getStatusMeta(job.status)
                const isActive = selected?.order_id === job.order_id
                return (
                  <div
                    key={job.order_id}
                    className="admin-card"
                    style={{
                      margin: 0,
                      padding: '18px 22px',
                      cursor: 'pointer',
                      borderColor: isActive ? 'var(--accent)' : undefined,
                      transition: 'border-color 0.15s',
                    }}
                    onClick={() => setSelected(isActive ? null : job)}
                  >
                    {/* Card header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(249,115,22,0.12)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <IconDoc />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                            Job #{job.order_id}
                          </div>
                          <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, fontSize: 10, marginTop: 3, display: 'inline-block' }}>
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons — always visible */}
                      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-accent"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 16px' }}
                          onClick={() => openConfirm(job, 'delivered')}
                        >
                          <IconCheck /> Delivered
                        </button>
                        <button
                          className="btn-danger-outline"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 16px' }}
                          onClick={() => openConfirm(job, 'failed')}
                        >
                          <IconX /> Failed
                        </button>
                      </div>
                    </div>

                    {/* Expanded address row */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                      <IconMapPin />
                      <span>{job.delivery_address || '—'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirmOpen}
        title={actionType === 'delivered' ? 'Confirm Delivery' : 'Report Failed Delivery'}
        message={
          actionType === 'delivered'
            ? `Confirm that job #${selected?.order_id} was successfully delivered to "${selected?.delivery_address || 'the destination'}"?`
            : `Mark job #${selected?.order_id} as failed? The system will be notified and the order may be rescheduled.`
        }
        confirmLabel={actionType === 'delivered' ? 'Confirm Delivery' : 'Report as Failed'}
        danger={actionType === 'failed'}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmOpen(false); setSelected(null) }}
      />
    </div>
  )
}
