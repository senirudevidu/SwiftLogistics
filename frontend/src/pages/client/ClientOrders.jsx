import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import ClientSidebar from '../../components/ClientSidebar'
import Pagination from '../../components/Pagination'
import { orderAPI } from '../../api'

const PAGE_SIZE = 9

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

// ── Icons ──────────────────────────────────────────────────────────────────
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)
const IconTruck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconUserCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
)
const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconXCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

// ── Progress steps ─────────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { key: 'pending',   label: 'Order Placed',   desc: 'Awaiting assignment' },
  { key: 'assigned',  label: 'Driver Assigned', desc: 'On the way'         },
  { key: 'delivered', label: 'Delivered',       desc: 'Package received'   },
]

// ── Detail field ───────────────────────────────────────────────────────────
function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value ?? '—'}</div>
    </div>
  )
}

// ── Order progress timeline ────────────────────────────────────────────────
function OrderTimeline({ status }) {
  const s = status?.toLowerCase()
  const isFailed = s === 'failed'
  const currentStep = isFailed ? -1 : PROGRESS_STEPS.findIndex(st => st.key === s)

  if (isFailed) {
    return (
      <div style={{ marginTop: 20 }}>
        <div className="detail-section-label">Progress</div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          color: '#f87171',
          fontSize: 13,
          fontWeight: 500,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Delivery was unsuccessful
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div className="detail-section-label">Progress</div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* vertical track */}
        <div style={{
          position: 'absolute',
          left: 11,
          top: 12,
          bottom: 12,
          width: 2,
          background: 'var(--border)',
          borderRadius: 2,
        }} />
        {/* filled portion */}
        <div style={{
          position: 'absolute',
          left: 11,
          top: 12,
          width: 2,
          height: currentStep <= 0 ? 0 : `calc(${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}% - 12px)`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'height 0.4s ease',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PROGRESS_STEPS.map((step, i) => {
            const done   = i < currentStep
            const active = i === currentStep
            const future = i > currentStep
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: active
                    ? 'var(--accent)'
                    : done
                      ? 'rgba(249,115,22,0.2)'
                      : 'var(--bg-surface)',
                  border: future ? '2px solid var(--border)' : '2px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: -28,
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: active ? '0 0 10px rgba(249,115,22,0.45)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {active && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: future ? 'var(--text-muted)' : 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {active ? step.desc : done ? '✓ Complete' : 'Pending'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton loading card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 58, height: 22, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ width: '85%', height: 13, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '60%', height: 13, borderRadius: 4 }} />
      <div style={{ marginTop: 6 }}>
        <div className="skeleton" style={{ height: 3, borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ── Order card (grid view) ─────────────────────────────────────────────────
function OrderCard({ order, selected, onClick }) {
  const meta       = getStatusMeta(order.status)
  const isSelected = selected?.order_id === order.order_id
  const s          = order.status?.toLowerCase()
  const barWidth   = s === 'delivered' ? '100%' : s === 'assigned' ? '66%' : s === 'pending' ? '33%' : '20%'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isSelected ? meta.color : 'var(--border)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        boxShadow: isSelected ? `0 0 0 3px ${meta.color}22` : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        userSelect: 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="order-id-badge">#{order.order_id}</span>
        <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* Address */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 5,
        color: 'var(--text-secondary)',
        fontSize: 12.5,
        lineHeight: 1.45,
        minHeight: 34,
      }}>
        <span style={{ marginTop: 2, flexShrink: 0, color: 'var(--text-muted)' }}><IconMapPin /></span>
        <span style={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {order.delivery_address || '—'}
        </span>
      </div>

      {/* Driver */}
      {order.driver_id ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#818cf8' }}>
          <IconTruck />
          Driver #{order.driver_id}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No driver assigned yet
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
        <div style={{
          height: '100%',
          width: barWidth,
          background: meta.color,
          borderRadius: 2,
          transition: 'width 0.4s ease',
          opacity: s === 'failed' ? 0.6 : 1,
        }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
export default function ClientOrders() {
  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]                 = useState(1)
  const [selected, setSelected]         = useState(null)
  const [viewMode, setViewMode]         = useState('grid')   // 'grid' | 'table'
  const location = useLocation()

  useEffect(() => {
    if (location.state?.filter) setStatusFilter(location.state.filter)
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await orderAPI.getMyOrders()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch {
      setOrders([])
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
        o.delivery_address?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status?.toLowerCase() === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filterOptions = [
    { value: 'all',       label: 'All',       count: orders.length },
    { value: 'pending',   label: 'Pending',   count: statusCounts.pending   || 0 },
    { value: 'assigned',  label: 'Assigned',  count: statusCounts.assigned  || 0 },
    { value: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
    { value: 'failed',    label: 'Failed',    count: statusCounts.failed    || 0 },
  ]

  const STAT_CARDS = [
    { key: 'pending',   icon: <IconClock />       },
    { key: 'assigned',  icon: <IconUserCheck />   },
    { key: 'delivered', icon: <IconCheckCircle /> },
    { key: 'failed',    icon: <IconXCircle />     },
  ]

  return (
    <div className="admin-layout">
      <ClientSidebar />

      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">My Orders</h1>
            <p className="admin-page-subtitle">
              {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 6 }}>
            {/* Grid / Table toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}>
              {[{ mode: 'grid', Icon: IconGrid }, { mode: 'table', Icon: IconList }].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={mode === 'grid' ? 'Card view' : 'Table view'}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: viewMode === mode ? 'var(--bg-card)' : 'transparent',
                    color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                  }}
                >
                  <Icon />
                </button>
              ))}
            </div>
            <button className="btn-icon-outline" onClick={load} aria-label="Refresh" title="Refresh">
              <IconRefresh />
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px 36px' }}>
          {STAT_CARDS.map(({ key, icon }) => {
            const meta   = getStatusMeta(key)
            const active = statusFilter === key
            return (
              <div
                key={key}
                className="stat-card-v2"
                style={{
                  cursor: 'pointer',
                  borderColor: active ? meta.color : undefined,
                  boxShadow: active ? `0 0 0 1px ${meta.color}44` : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                }}
                onClick={() => { setStatusFilter(active ? 'all' : key); setPage(1) }}
              >
                <div className="stat-card-icon" style={{ background: meta.bg, color: meta.color }}>
                  {icon}
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: meta.color }}>
                    {loading ? '—' : statusCounts[key] || 0}
                  </div>
                  <div className="stat-card-label">{meta.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Filter bar + content card ── */}
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
                placeholder="Search by order ID or address…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search orders"
              />
            </div>
          </div>

          {/* ── Grid view ── */}
          {viewMode === 'grid' && (
            <div style={{ padding: '20px 20px 0' }}>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : paginated.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '56px 0',
                  gap: 14,
                }}>
                  <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <IconPackage />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {search || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {search || statusFilter !== 'all'
                        ? 'Try adjusting your search or clearing the filter'
                        : 'Place your first order from the "New Order" page'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                  {paginated.map(o => (
                    <OrderCard
                      key={o.order_id}
                      order={o}
                      selected={selected}
                      onClick={() => setSelected(selected?.order_id === o.order_id ? null : o)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Table view ── */}
          {viewMode === 'table' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Delivery Address</th>
                  <th>Driver</th>
                  <th>Progress</th>
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
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">
                      {search || statusFilter !== 'all'
                        ? 'No orders match your filters.'
                        : orders.length === 0
                          ? 'No orders found. Place your first order from the "New Order" page.'
                          : 'No results.'}
                    </td>
                  </tr>
                ) : paginated.map(o => {
                  const meta = getStatusMeta(o.status)
                  const s    = o.status?.toLowerCase()
                  const bar  = s === 'delivered' ? '100%' : s === 'assigned' ? '66%' : s === 'pending' ? '33%' : '20%'
                  return (
                    <tr
                      key={o.order_id}
                      className={selected?.order_id === o.order_id ? 'tr-selected' : ''}
                      onClick={() => setSelected(selected?.order_id === o.order_id ? null : o)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><span className="order-id-badge">#{o.order_id}</span></td>
                      <td className="td-muted td-truncate" title={o.delivery_address}>
                        {o.delivery_address}
                      </td>
                      <td className="td-muted">
                        {o.driver_id
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8' }}><IconTruck />Driver #{o.driver_id}</span>
                          : '—'}
                      </td>
                      <td style={{ width: 120 }}>
                        <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: bar, background: meta.color, borderRadius: 2 }} />
                        </div>
                      </td>
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
          )}

          <div className="table-footer" style={{ marginTop: viewMode === 'grid' ? 16 : 0 }}>
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
              <div
                className="detail-avatar"
                style={{ background: meta.bg, color: meta.color, fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                #{selected.order_id}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="detail-name">Order #{selected.order_id}</div>
                <span
                  className="status-pill-custom"
                  style={{ background: meta.bg, color: meta.color, marginTop: 4, display: 'inline-block' }}
                >
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
              <DetailField label="Status"   value={meta.label} />
            </div>

            <div className="detail-section-label" style={{ marginTop: 20 }}>Delivery</div>
            <div className="detail-fields">
              <DetailField label="Address" value={selected.delivery_address} />
            </div>

            {selected.driver_id && (
              <>
                <div className="detail-section-label" style={{ marginTop: 20 }}>Assignment</div>
                <div className="detail-fields">
                  <DetailField label="Driver ID" value={`#${selected.driver_id}`} />
                </div>
              </>
            )}

            <OrderTimeline status={selected.status} />
          </aside>
        )
      })()}
    </div>
  )
}
