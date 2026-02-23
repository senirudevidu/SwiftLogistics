import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import DetailField from '../../components/DetailField'
import { adminAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getInitials } from '../../lib/utils'

const PAGE_SIZE = 10

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
)
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)



export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getDrivers()
      setDrivers(res.data)
    } catch {
      toast('Failed to load drivers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return drivers.filter(d =>
      d.username?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.vehicle_number?.toLowerCase().includes(q)
    )
  }, [drivers, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteDriver(deleteTarget.id)
      setDrivers(prev => prev.filter(d => d.id !== deleteTarget.id))
      toast(`Driver "${deleteTarget.username}" removed`, 'success')
      if (selected?.id === deleteTarget.id) setSelected(null)
      setDeleteTarget(null)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Delete is not yet supported by the server.'
      toast(msg, 'error')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="admin-layout">
      <Sidebar role="admin" />
      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Drivers</h1>
            <p className="admin-page-subtitle">
              {loading ? 'Loading…' : `${drivers.length} registered driver${drivers.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="admin-topbar-actions">
            <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
              <IconRefresh />
            </button>
            <button className="btn-accent" onClick={() => navigate('/admin/create-driver')}>
              <IconPlus /> New Driver
            </button>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="admin-card" style={{ margin: '0 36px 36px' }}>
          <div className="admin-card-header">
            <div className="search-input-wrap">
              <IconSearch />
              <input
                className="search-input"
                placeholder="Search by username, email or vehicle…"
                value={search}
                onChange={handleSearch}
                aria-label="Search drivers"
              />
            </div>
            <span className="table-result-count">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Email</th>
                <th>Vehicle No.</th>
                <th>Status</th>
                <th style={{ width: 80 }}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading drivers…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    {search ? 'No drivers match your search.' : 'No drivers yet.'}
                  </td>
                </tr>
              ) : paginated.map(d => (
                <tr
                  key={d.id}
                  className={selected?.id === d.id ? 'tr-selected' : ''}
                  onClick={() => setSelected(d)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="table-user-cell">
                      <div className="table-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {getInitials(d.username)}
                      </div>
                      <span className="table-username">{d.username}</span>
                    </div>
                  </td>
                  <td className="td-muted">{d.email || '—'}</td>
                  <td className="td-muted">{d.vehicle_number || '—'}</td>
                  <td>
                    <span className={`status-pill ${d.is_active ? 'status-active' : 'status-inactive'}`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="table-actions">
                      <button
                        className="icon-btn"
                        onClick={() => setSelected(d)}
                        title="View details"
                        aria-label={`View ${d.username}`}
                      >
                        <IconEye />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        onClick={() => setDeleteTarget(d)}
                        title="Delete driver"
                        aria-label={`Delete ${d.username}`}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">
            <span className="td-muted" style={{ fontSize: 12 }}>
              {filtered.length === 0
                ? 'No results'
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {selected && (
        <aside className="detail-drawer" aria-label="Driver details">
          <div className="detail-drawer-header">
            <div className="detail-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              {getInitials(selected.username)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="detail-name">{selected.username}</div>
              <span className={`status-pill ${selected.is_active ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                {selected.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Close panel">
              <IconClose />
            </button>
          </div>

          <div className="detail-section-label">Account info</div>
          <div className="detail-fields">
            <DetailField label="Username" value={selected.username} />
            <DetailField label="Email" value={selected.email} />
            <DetailField label="Vehicle No." value={selected.vehicle_number} />
            <DetailField label="Role" value="driver" />
            <DetailField label="Status" value={selected.is_active ? 'Active' : 'Inactive'} />
          </div>

          <div className="detail-drawer-actions">
            <button
              className="btn-danger-outline"
              onClick={() => { setDeleteTarget(selected); setSelected(null) }}
            >
              <IconTrash /> Delete Driver
            </button>
          </div>
        </aside>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Driver"
        message={`Are you sure you want to permanently delete "${deleteTarget?.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
