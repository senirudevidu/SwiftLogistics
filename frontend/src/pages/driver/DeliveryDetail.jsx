import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

/* ── Icons ──────────────────────────────────────────────────────────────── */
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.61a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16" />
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconPOD = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><polyline points="9 15 11 17 15 13" />
  </svg>
)

/* ── Failure reasons ─────────────────────────────────────────────────────── */
const FAILURE_REASONS = [
  { value: 'recipient_absent',  label: 'Recipient not present' },
  { value: 'wrong_address',     label: 'Wrong / inaccessible address' },
  { value: 'refused',           label: 'Delivery refused by recipient' },
  { value: 'damaged',           label: 'Package damaged in transit' },
  { value: 'vehicle_breakdown', label: 'Vehicle breakdown' },
  { value: 'weather',           label: 'Severe weather conditions' },
  { value: 'other',             label: 'Other reason' },
]

/* ── Delivery timeline builder ───────────────────────────────────────────── */
function buildTimeline(order) {
  const s = order?.status?.toLowerCase() || 'pending'
  const isDelivered = s === 'delivered'
  const isFailed    = s === 'delivery_failed' || s === 'failed'

  const steps = [
    {
      label: 'Order Placed',
      note:  'Registered in SwiftLogistics system',
      time:  order.created_at,
      done:  true,
    },
    {
      label: 'Assigned to Driver',
      note:  'Driver assignment confirmed via CMS (SOAP)',
      time:  ['assigned', 'dispatched', 'delivered', 'delivery_failed', 'failed'].includes(s) ? order.created_at : null,
      done:  ['assigned', 'dispatched', 'delivered', 'delivery_failed', 'failed'].includes(s),
    },
    {
      label: 'En Route to Destination',
      note:  'Route optimised via ROS (REST)',
      time:  ['dispatched', 'delivered', 'delivery_failed', 'failed'].includes(s) ? order.updated_at : null,
      done:  ['dispatched', 'delivered', 'delivery_failed', 'failed'].includes(s),
    },
  ]

  if (isDelivered) {
    steps.push({ label: 'Delivered ✓', note: 'Successfully handed to recipient', time: order.updated_at, done: true, success: true })
  } else if (isFailed) {
    steps.push({ label: 'Delivery Failed', note: 'Notified via WMS TCP messaging', time: order.updated_at, done: true, failed: true })
  } else {
    steps.push({ label: 'Awaiting Delivery', note: 'Pending completion at destination', time: null, done: false })
  }

  return steps
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function DeliveryDetail() {
  const { orderId } = useParams()
  const navigate    = useNavigate()
  const { toast }   = useToast()

  const [job, setJob]                       = useState(null)
  const [loading, setLoading]               = useState(true)
  const [actionLoading, setActionLoading]   = useState(false)
  const [confirmDeliver, setConfirmDeliver] = useState(false)
  const [showFailureForm, setShowFailureForm] = useState(false)
  const [failureReason, setFailureReason]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getMyJobs()
      const all = Array.isArray(res.data) ? res.data : []
      setJob(all.find(o => String(o.order_id) === String(orderId)) || null)
    } catch {
      toast('Failed to load delivery details', 'error')
    } finally {
      setLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => { load() }, [load])

  const canAct  = job && ['assigned', 'dispatched'].includes(job.status?.toLowerCase())
  const meta    = job ? getStatusMeta(job.status) : null
  const timeline = job ? buildTimeline(job) : []

  const handleDeliver = async () => {
    setActionLoading(true)
    try {
      await driverAPI.markDelivered(job.order_id)
      toast(`Job #${job.order_id} marked as delivered!`, 'success')
      setConfirmDeliver(false)
      navigate('/driver/proof-of-delivery', { state: { orderId: job.order_id } })
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
      setActionLoading(false)
    }
  }

  const handleFail = async () => {
    if (!failureReason) return
    setActionLoading(true)
    try {
      await driverAPI.markFailed(job.order_id)
      toast(`Job #${job.order_id} marked as failed`, 'warning')
      setShowFailureForm(false)
      setFailureReason('')
      await load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AppLayout role="driver">
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <button className="back-btn" onClick={() => navigate('/driver/jobs')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Jobs
          </button>
          <h1 className="admin-page-title" style={{ marginTop: 8 }}>Delivery Detail</h1>
          <p className="admin-page-subtitle">Full delivery information and middleware history</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-icon-outline" onClick={load} title="Refresh">
            <IconRefresh />
          </button>
          {canAct && (
            <button className="btn-accent" onClick={() => setConfirmDeliver(true)} disabled={actionLoading}>
              <IconCheck /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '60px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
          <span className="spinner" /> Loading delivery details…
        </div>
      ) : !job ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Delivery Not Found
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Job #{orderId} is not in your assigned deliveries.
          </div>
          <button className="btn-secondary" onClick={() => navigate('/driver/jobs')}>
            Back to Jobs
          </button>
        </div>
      ) : (
        <div className="delivery-detail-grid">

          {/* ── Left column: info + timeline ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Order info card */}
            <div className="admin-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="order-id-badge">#{job.order_id}</span>
                  <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </div>
              <div style={{ padding: '8px 22px 22px' }}>
                {[
                  { icon: '📍', label: 'Delivery Address', value: job.delivery_address || '—' },
                  { icon: '📦', label: 'Product ID',       value: job.product_id ?? '—' },
                  { icon: '👤', label: 'Client ID',        value: `#${job.client_id || '—'}` },
                  { icon: '🚛', label: 'Driver ID',        value: `#${job.driver_id || '—'}` },
                  { icon: '🕐', label: 'Placed',           value: formatDate(job.created_at) },
                  { icon: '🔄', label: 'Last Updated',     value: formatDate(job.updated_at) },
                ].map(row => (
                  <div
                    key={row.label}
                    style={{
                      padding: '11px 0',
                      borderBottom: '1px solid var(--border)',
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr',
                      gap: 12,
                      alignItems: 'start',
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, color: 'var(--text-muted)',
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                      <span>{row.icon}</span> {row.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special instructions */}
            <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                📋 Special Instructions
              </div>
              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}>
                {job.notes || 'No special instructions. Handle with standard care and procedures.'}
              </div>
            </div>

            {/* Delivery timeline */}
            <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                marginBottom: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Delivery History
              </div>
              <div className="delivery-timeline">
                {timeline.map((step, i) => (
                  <div key={i} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{
                        background: step.success ? 'rgba(34,197,94,0.12)'  :
                                    step.failed  ? 'rgba(239,68,68,0.12)'  :
                                    step.done    ? 'rgba(249,115,22,0.12)' : 'var(--bg-surface)',
                        border: `2px solid ${
                          step.success ? '#4ade80'        :
                          step.failed  ? '#f87171'        :
                          step.done    ? 'var(--accent)'  : 'var(--border)'
                        }`,
                      }}
                    >
                      {step.done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke={step.success ? '#4ade80' : step.failed ? '#f87171' : 'var(--accent)'}
                          strokeWidth="3.5" strokeLinecap="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label" style={{ color: step.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {step.label}
                      </div>
                      {step.time && <div className="timeline-time">{formatDate(step.time)}</div>}
                      <div className="timeline-note">{step.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: actions + info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Action card */}
            {canAct && !showFailureForm && (
              <div className="admin-card" style={{ margin: 0, padding: '20px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  Update Status
                </div>
                {actionLoading ? (
                  <div className="status-processing-overlay">
                    <span className="spinner" style={{ width: 28, height: 28 }} />
                    <div className="syncing-badge">
                      <span className="conn-dot" style={{ background: 'var(--accent)', animation: 'connLivePulse 1s infinite' }} />
                      Syncing with middleware…
                    </div>
                    <div className="status-processing-text">Updating via CMS / WMS TCP…</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      className="btn-accent"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setConfirmDeliver(true)}
                    >
                      <IconCheck /> Mark as Delivered
                    </button>
                    <button className="btn-danger-outline" onClick={() => setShowFailureForm(true)}>
                      <IconX /> Report Failure
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => navigate('/driver/proof-of-delivery', { state: { orderId: job.order_id } })}
                    >
                      <IconPOD /> Submit Proof of Delivery
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Failure form */}
            {canAct && showFailureForm && (
              <div className="admin-card" style={{ margin: 0, padding: '20px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  marginBottom: 14, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  ⚠ Report Failure
                </div>
                {actionLoading ? (
                  <div className="status-processing-overlay">
                    <span className="spinner" style={{ width: 28, height: 28 }} />
                    <div className="syncing-badge">
                      <span className="conn-dot" style={{ background: 'var(--accent)', animation: 'connLivePulse 1s infinite' }} />
                      Syncing with middleware…
                    </div>
                    <div className="status-processing-text">Broadcasting failure via WMS TCP…</div>
                  </div>
                ) : (
                  <>
                    <div className="failure-reason-wrap" style={{ marginBottom: 14 }}>
                      <div className="failure-reason-label">Failure Reason</div>
                      <select
                        className="failure-reason-select"
                        value={failureReason}
                        onChange={e => setFailureReason(e.target.value)}
                      >
                        <option value="">— Select a reason —</option>
                        {FAILURE_REASONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => { setShowFailureForm(false); setFailureReason('') }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-danger-outline"
                        style={{ flex: 1, opacity: failureReason ? 1 : 0.4, justifyContent: 'center' }}
                        disabled={!failureReason}
                        onClick={handleFail}
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Contact card */}
            <div className="admin-card" style={{ margin: 0, padding: '20px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Customer Contact
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Customer details are managed via the CMS portal.
              </p>
              <button
                className="contact-btn"
                onClick={() => toast('Customer contact is managed via the CMS portal', 'info')}
              >
                <IconPhone /> Contact Customer
              </button>
            </div>

            {/* Middleware source card */}
            <div className="admin-card" style={{ margin: 0, padding: '20px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Middleware Source
              </div>
              {[
                { label: 'Assignment',   value: 'CMS (SOAP)' },
                { label: 'Route',        value: 'ROS (REST)' },
                { label: 'Notification', value: 'WMS (TCP)'  },
                { label: 'Status Sync',  value: 'Message Queue' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delivery Modal ── */}
      {confirmDeliver && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 299 }}
            onClick={() => !actionLoading && setConfirmDeliver(false)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 300, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px', width: 'min(420px, 92vw)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
              Confirm Delivery
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Mark job{' '}
              <strong style={{ color: 'var(--text-primary)' }}>#{job?.order_id}</strong> as delivered to{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>"{job?.delivery_address}"</strong>?
            </div>
            {actionLoading ? (
              <div className="status-processing-overlay" style={{ paddingBottom: 8 }}>
                <span className="spinner" style={{ width: 32, height: 32 }} />
                <div className="syncing-badge">
                  <span className="conn-dot" style={{ background: 'var(--accent)', animation: 'connLivePulse 1s infinite' }} />
                  Syncing with middleware…
                </div>
                <div className="status-processing-text">Confirming via CMS-SOAP &amp; WMS-TCP…</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setConfirmDeliver(false)}>Cancel</button>
                <button
                  className="btn-accent"
                  style={{ minWidth: 150, justifyContent: 'center' }}
                  onClick={handleDeliver}
                >
                  <IconCheck /> Confirm Delivery
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}
