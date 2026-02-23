import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import DetailField from '../../components/DetailField'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

const PAGE_SIZE = 12



/* ── Icons ── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
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
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)





export default function DriverJobs() {
  const [jobs, setJobs]                     = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [page, setPage]                     = useState(1)
  const [selected, setSelected]             = useState(null)
  const [confirmAction, setConfirmAction]   = useState(null) // { type: 'delivered'|'failed', job }
  const [actionLoading, setActionLoading]   = useState(false)
  const location = useLocation()
  const { toast } = useToast()

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

  useEffect(() => {
    if (location.state?.filter) {
      setStatusFilter(location.state.filter)
    }
    load()
  }, [load])

  const statusCounts = useMemo(() =>
    jobs.reduce((acc, j) => {
      const s = j.status?.toLowerCase() || 'unknown'
      return { ...acc, [s]: (acc[s] || 0) + 1 }
    }, {}),
  [jobs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter(j => {
      const matchSearch = !q ||
        String(j.order_id).includes(q) ||
        j.delivery_address?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || j.status?.toLowerCase() === statusFilter
      return matchSearch && matchStatus
    })
  }, [jobs, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filterOptions = [
    { value: 'all',       label: 'All',       count: jobs.length },
    { value: 'assigned',  label: 'Assigned',  count: statusCounts.assigned  || 0 },
    { value: 'pending',   label: 'Pending',   count: statusCounts.pending   || 0 },
    { value: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
    { value: 'failed',    label: 'Failed',    count: statusCounts.failed    || 0 },
  ]

  const canAct = (job) => {
    const s = job?.status?.toLowerCase()
    return s === 'assigned' || s === 'pending'
  }

  const handleAction = async () => {
    if (!confirmAction) return
    const { type, job } = confirmAction
    setActionLoading(true)
    try {
      if (type === 'delivered') {
        await driverAPI.markDelivered(job.order_id, {})
      } else {
        await driverAPI.markFailed(job.order_id, {})
      }
      toast(
        type === 'delivered'
          ? `Job #${job.order_id} marked as delivered.`
          : `Job #${job.order_id} marked as failed.`,
        type === 'delivered' ? 'success' : 'warning'
      )
      setSelected(null)
      await load()
    } catch (err) {
      const status = err.response?.status
      if (status === 404) {
        toast('Status update endpoint is not yet available.', 'info')
      } else {
        toast('Failed to update job status.', 'error')
      }
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">My Jobs</h1>
            <p className="admin-page-subtitle">
              {loading ? 'Loading…' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} in your queue`}
            </p>
          </div>
          <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
            <IconRefresh />
          </button>
        </div>

        {/* ── Status stat strip ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px 36px' }}>
          {['assigned', 'pending', 'delivered', 'failed'].map(s => {
            const meta = getStatusMeta(s)
            return (
              <div
                key={s}
                className="stat-card-v2"
                style={{
                  cursor: 'pointer',
                  borderColor: statusFilter === s ? meta.color : undefined,
                }}
                onClick={() => { setStatusFilter(statusFilter === s ? 'all' : s); setPage(1) }}
              >
                <div className="stat-card-icon" style={{ background: meta.bg, color: meta.color }}>
                  <IconPackage />
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: meta.color }}>
                    {loading ? '—' : statusCounts[s] || 0}
                  </div>
                  <div className="stat-card-label">{meta.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Filter + Table ── */}
        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="filter-pills-row" style={{ margin: 0 }}>
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-pill ${statusFilter === opt.value ? 'filter-pill--active' : ''}`}
                  onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                >
                  {opt.label}
                  <span className="filter-pill-count">{opt.count}</span>
                </button>
              ))}
            </div>
            <div className="search-input-wrap" style={{ marginLeft: 'auto' }}>
              <IconSearch />
              <input
                className="search-input"
                placeholder="Search by job ID or address…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search jobs"
              />
              {search && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <IconClose />
                </button>
              )}
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Delivery Address</th>
                <th>Client ID</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--bg-surface)', width: j === 1 ? '70%' : '50%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty" style={{ padding: '52px 20px', textAlign: 'center' }}>
                      <div style={{ marginBottom: 12, opacity: 0.35 }}><IconPackage /></div>
                      {search || statusFilter !== 'all'
                        ? 'No jobs match your filters.'
                        : 'No jobs assigned yet. Jobs will appear here once dispatched.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(job => {
                  const meta = getStatusMeta(job.status)
                  const isSelected = selected?.order_id === job.order_id
                  return (
                    <tr
                      key={job.order_id}
                      className={isSelected ? 'tr-selected' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(isSelected ? null : job)}
                    >
                      <td>
                        <span className="order-id-badge">#{job.order_id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <IconMapPin />
                          <span className="td-truncate" style={{ maxWidth: 220 }}>
                            {job.delivery_address || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="td-muted">{job.client_id ?? '—'}</td>
                      <td>
                        <span
                          className="status-pill-custom"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="td-muted" style={{ fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconCalendar />
                          {formatDate(job.created_at)}
                        </div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="table-actions">
                          {canAct(job) && (
                            <>
                              <button
                                className="icon-btn"
                                title="Mark as Delivered"
                                onClick={() => setConfirmAction({ type: 'delivered', job })}
                                style={{ color: '#4ade80' }}
                              >
                                <IconCheck />
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                title="Mark as Failed"
                                onClick={() => setConfirmAction({ type: 'failed', job })}
                              >
                                <IconX />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span className="table-result-count">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setSelected(null)}
          />
          <aside className="detail-drawer" aria-label="Job details">
            <div className="detail-drawer-header">
              <div
                className="detail-avatar"
                style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent)' }}
              >
                <IconPackage />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="detail-name">Job #{selected.order_id}</div>
                <span
                  className="status-pill-custom"
                  style={{
                    background: getStatusMeta(selected.status).bg,
                    color: getStatusMeta(selected.status).color,
                    marginTop: 6,
                    display: 'inline-block',
                  }}
                >
                  {getStatusMeta(selected.status).label}
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                <IconClose />
              </button>
            </div>

            <div className="detail-section-label">Delivery Details</div>
            <div className="detail-fields">
              <DetailField label="Order ID"          value={`#${selected.order_id}`} />
              <DetailField label="Delivery Address"  value={selected.delivery_address} />
              <DetailField label="Client ID"         value={selected.client_id != null ? `#${selected.client_id}` : null} />
              <DetailField label="Driver ID"         value={selected.driver_id != null ? `#${selected.driver_id}` : null} />
            </div>

            <div className="detail-section-label">Timeline</div>
            <div className="detail-fields">
              <DetailField label="Created"  value={formatDate(selected.created_at)} />
              <DetailField label="Updated"  value={formatDate(selected.updated_at)} />
            </div>

            {canAct(selected) && (
              <div className="detail-drawer-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn-accent"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setSelected(null); setConfirmAction({ type: 'delivered', job: selected }) }}
                >
                  <IconCheck /> Mark Delivered
                </button>
                <button
                  className="btn-danger-outline"
                  onClick={() => { setSelected(null); setConfirmAction({ type: 'failed', job: selected }) }}
                >
                  <IconX /> Mark Failed
                </button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'delivered' ? 'Confirm Delivery' : 'Mark as Failed'}
        message={
          confirmAction?.type === 'delivered'
            ? `Confirm that job #${confirmAction?.job?.order_id} has been successfully delivered to "${confirmAction?.job?.delivery_address || 'the destination'}"?`
            : `Mark job #${confirmAction?.job?.order_id} as failed? This action will notify the system.`
        }
        confirmLabel={confirmAction?.type === 'delivered' ? 'Confirm Delivery' : 'Mark Failed'}
        danger={confirmAction?.type === 'failed'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
