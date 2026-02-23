import React, { useState, useEffect, useMemo } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Pagination from '../../components/Pagination'
import { adminAPI } from '../../api'
import { useToast } from '../../context/ToastContext'

const PAGE_SIZE = 12

const STATUS_META = {
  pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#eab308', label: 'Pending'   },
  assigned:  { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', label: 'Assigned'  },
  delivered: { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', label: 'Delivered' },
  failed:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: 'Failed'    },
}

function getStatusMeta(status) {
  return STATUS_META[status?.toLowerCase()] || {
    bg: 'rgba(255,255,255,0.06)', color: '#8a8f9e', label: status || 'Unknown',
  }
}

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
const IconPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value ?? '—'}</div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setUnavailable(false)
    try {
      const res = await adminAPI.getOrders()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      if (err?.response?.status === 404) {
        // Gateway doesn't expose GET /orders yet — degrade gracefully
        setUnavailable(true)
        setOrders([])
      } else {
        toast('Failed to load orders', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const statusCounts = useMemo(() =>
    orders.reduce((acc, o) => {
      const s = o.status?.toLowerCase() || 'unknown'
      return { ...acc, [s]: (acc[s] || 0) + 1 }
    }, {}),
  [orders])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const matchSearch = !q ||
        String(o.order_id).includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        String(o.client_id).includes(q)
      const matchStatus = statusFilter === 'all' || o.status?.toLowerCase() === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filterOptions = [
    { value: 'all',       label: 'All',       count: orders.length },
    { value: 'pending',   label: 'Pending',   count: statusCounts.pending   || 0 },
    { value: 'assigned',  label: 'Assigned',  count: statusCounts.assigned  || 0 },
    { value: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
    { value: 'failed',    label: 'Failed',    count: statusCounts.failed    || 0 },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Orders</h1>
            <p className="admin-page-subtitle">
              {loading ? 'Loading…' : unavailable ? 'Orders service not yet available' : `${orders.length} total order${orders.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
            <IconRefresh />
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px 36px' }}>
          {['pending', 'assigned', 'delivered', 'failed'].map(s => {
            const meta = getStatusMeta(s)
            return (
              <div
                key={s}
                className="stat-card-v2"
                style={{ cursor: 'pointer', borderColor: statusFilter === s ? meta.color : undefined }}
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
                placeholder="Search by order ID, client or address…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search orders"
              />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client ID</th>
                <th>Driver ID</th>
                <th>Delivery Address</th>
                <th>Status</th>
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
              ) : unavailable ? (
                <tr>
                  <td colSpan="5">
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '48px 20px', gap: 12,
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'rgba(249,115,22,0.08)',
                        border: '1px solid rgba(249,115,22,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent)',
                      }}>
                        <IconPackage />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          Orders service not yet available
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                          The GET /orders gateway route is not yet implemented.
                          Orders will appear here automatically once connected.
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    {search || statusFilter !== 'all' ? 'No orders match your filters.' : 'No orders yet.'}
                  </td>
                </tr>
              ) : paginated.map(o => {
                const meta = getStatusMeta(o.status)
                return (
                  <tr
                    key={o.order_id}
                    className={selected?.order_id === o.order_id ? 'tr-selected' : ''}
                    onClick={() => setSelected(o)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="order-id-badge">#{o.order_id}</span>
                    </td>
                    <td className="td-muted">{o.client_id}</td>
                    <td className="td-muted">{o.driver_id ?? '—'}</td>
                    <td className="td-muted td-truncate" title={o.delivery_address}>{o.delivery_address}</td>
                    <td>
                      <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
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

      {/* ── Order detail drawer ── */}
      {selected && (() => {
        const meta = getStatusMeta(selected.status)
        return (
          <aside className="detail-drawer" aria-label="Order details">
            <div className="detail-drawer-header">
              <div className="detail-avatar" style={{ background: meta.bg, color: meta.color, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                #{selected.order_id}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="detail-name">Order #{selected.order_id}</div>
                <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color, marginTop: 4, display: 'inline-block' }}>
                  {meta.label}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Close panel">
                <IconClose />
              </button>
            </div>

            <div className="detail-section-label">Order info</div>
            <div className="detail-fields">
              <DetailField label="Order ID" value={`#${selected.order_id}`} />
              <DetailField label="Client ID" value={selected.client_id} />
              <DetailField label="Driver ID" value={selected.driver_id ?? 'Not assigned'} />
              <DetailField label="Status" value={meta.label} />
            </div>

            <div className="detail-section-label" style={{ marginTop: 20 }}>Delivery</div>
            <div className="detail-fields">
              <DetailField label="Address" value={selected.delivery_address} />
            </div>
          </aside>
        )
      })()}
    </div>
  )
}
