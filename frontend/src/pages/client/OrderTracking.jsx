import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { orderAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

/* ── Progress step definitions ─────────────────────────────────────────────── */
const STEPS = [
  { key: 'pending',   label: 'Order Placed',    desc: 'Your order has been received and is awaiting a driver assignment.' },
  { key: 'assigned',  label: 'Driver Assigned',  desc: 'A driver has been assigned and is preparing for collection.' },
  { key: 'dispatched',label: 'Out for Delivery', desc: 'Your package is on the way — driver is en route.' },
  { key: 'delivered', label: 'Delivered',         desc: 'Package successfully delivered. Thank you for using SwiftLogistics!' },
]

const STATUS_ORDER = ['pending', 'assigned', 'dispatched', 'delivered']

function stepIndex(status) {
  const s = status?.toLowerCase()
  if (s === 'delivery_failed' || s === 'failed') return -1
  return STATUS_ORDER.indexOf(s)
}

function TrackingTimeline({ status }) {
  const s    = status?.toLowerCase()
  const idx  = stepIndex(s)
  const fail = idx === -1

  if (fail) {
    return (
      <div style={{ padding: '10px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          color: '#f87171', fontSize: 13, fontWeight: 500,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          Delivery was unsuccessful. Please contact support.
        </div>
      </div>
    )
  }

  return (
    <div className="tracking-timeline" style={{ padding: '6px 0' }}>
      {STEPS.map((step, i) => {
        const done   = i < idx
        const active = i === idx
        const future = i > idx
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.key} className="tracking-step">
            <div className="tracking-step-track">
              <div className={`tracking-step-dot ${active ? 'tracking-step-dot--active' : done ? 'tracking-step-dot--done' : 'tracking-step-dot--future'}`}>
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {active && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                )}
              </div>
              {!isLast && (
                <div className={`tracking-step-line ${done ? 'tracking-step-line--done' : ''}`} style={{ minHeight: 32 }} />
              )}
            </div>
            <div className="tracking-step-content">
              <div className={`tracking-step-label ${future ? 'tracking-step-label--future' : ''}`}>
                {step.label}
              </div>
              <div className="tracking-step-desc">
                {active ? step.desc : done ? '✓ Completed' : 'Awaiting previous step'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MapPlaceholder({ address }) {
  return (
    <div className="tracking-map-placeholder">
      <div className="tracking-map-grid" />
      <div className="tracking-map-route">
        <svg width="280" height="160" viewBox="0 0 280 160" fill="none">
          {/* Mock route path */}
          <path
            d="M30 130 C 60 100, 100 90, 140 70 S 200 40, 250 30"
            stroke="rgba(249,115,22,0.45)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Start point */}
          <circle cx="30" cy="130" r="7" fill="rgba(249,115,22,0.8)" />
          <circle cx="30" cy="130" r="14" fill="rgba(249,115,22,0.15)" />
          {/* Waypoint */}
          <circle cx="140" cy="70" r="5" fill="rgba(249,115,22,0.5)" />
          <circle cx="140" cy="70" r="10" fill="rgba(249,115,22,0.1)" />
          {/* End point */}
          <circle cx="250" cy="30" r="8" fill="#4ade80" />
          <circle cx="250" cy="30" r="16" fill="rgba(34,197,94,0.15)" />
          {/* Truck icon at midpoint */}
          <g transform="translate(125,55)">
            <rect x="-12" y="-8" width="24" height="10" rx="2" fill="rgba(249,115,22,0.9)" />
            <circle cx="-6" cy="4" r="3" fill="#fff" />
            <circle cx="6" cy="4" r="3" fill="#fff" />
          </g>
        </svg>
      </div>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '10px 16px',
          display: 'inline-block',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Destination
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, maxWidth: 220 }}>
            {address || 'Address not available'}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        Map Preview
      </div>
    </div>
  )
}

export default function OrderTracking() {
  const [orders, setOrders]       = useState([])
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [polling, setPolling]     = useState(true)
  const intervalRef               = useRef(null)
  const location                  = useLocation()
  const { toast }                 = useToast()

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await orderAPI.getMyOrders()
      const data = Array.isArray(res.data) ? res.data : []
      setOrders(data)
      // Keep selected order in sync
      setSelected(prev =>
        prev ? (data.find(o => o.order_id === prev.order_id) || data[0] || null) : (data[0] || null),
      )
    } catch {
      if (!silent) toast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Poll every 15s for live updates
  useEffect(() => {
    if (!polling) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => fetchOrders(true), 15_000)
    return () => clearInterval(intervalRef.current)
  }, [polling, fetchOrders])

  // Pre-select from navigation state
  useEffect(() => {
    if (location.state?.orderId && orders.length > 0) {
      const o = orders.find(x => x.order_id === location.state.orderId)
      if (o) setSelected(o)
    }
  }, [location.state, orders])

  const meta = selected ? getStatusMeta(selected.status) : null

  return (
    <AppLayout role="client">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Order Tracking</h1>
          <p className="admin-page-subtitle">
            Real-time delivery tracking via the ROS middleware
          </p>
        </div>
      <div className="admin-topbar-actions">
          <button
            className={`conn-pill ${polling ? 'conn-pill--live' : 'conn-pill--paused'}`}
            onClick={() => setPolling(p => !p)}
            title={polling ? 'Click to pause auto-refresh' : 'Click to resume auto-refresh'}
          >
            <span className="conn-dot" />
            {polling ? 'Live — polling every 15s' : 'Paused'}
          </button>
          <button
            className="btn-icon-outline"
            onClick={() => fetchOrders()}
            title="Refresh now"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Order selector ── */}
      {!loading && orders.length > 1 && (
        <div style={{ padding: '0 36px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
            Select Order
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {orders.slice().reverse().slice(0, 8).map(o => {
              const m = getStatusMeta(o.status)
              const isSelected = selected?.order_id === o.order_id
              return (
                <button
                  key={o.order_id}
                  onClick={() => setSelected(o)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isSelected ? m.color : 'var(--border)'}`,
                    background: isSelected ? m.bg : 'var(--bg-card)',
                    color: isSelected ? m.color : 'var(--text-secondary)',
                    fontSize: 12,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  #{o.order_id}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="tracking-layout">
          <div className="admin-card" style={{ margin: 0, padding: 40, textAlign: 'center' }}>
            <span className="spinner" style={{ display: 'inline-block', marginRight: 10 }} />
            Loading orders…
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No orders yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Place an order to start tracking it here.</div>
        </div>
      ) : (
        <div className="tracking-layout">
          {/* ── Map + route ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <MapPlaceholder address={selected?.delivery_address} />

            {/* Order info card */}
            {selected && (
              <div className="admin-card" style={{ margin: 0 }}>
                <div className="admin-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="order-id-badge">#{selected.order_id}</span>
                    <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(selected.created_at)}
                  </span>
                </div>
                <div style={{ padding: '14px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 5 }}>Delivery Address</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{selected.delivery_address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 5 }}>Assigned Driver</div>
                    <div style={{ fontSize: 13, color: selected.driver_id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                      {selected.driver_id ? `Driver #${selected.driver_id}` : 'Awaiting assignment via ROS'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 5 }}>Product ID</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{selected.product_id ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 5 }}>Last Updated</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(selected.updated_at || selected.created_at)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Timeline panel ── */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="admin-card" style={{ margin: 0 }}>
                <div className="admin-card-header">
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                    Delivery Progress
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Polling every 15s
                  </span>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  <TrackingTimeline status={selected.status} />
                </div>
              </div>

              {/* Middleware info card */}
              <div className="admin-card" style={{ margin: 0, padding: '16px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Middleware Info
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Status Source', value: 'ROS → Gateway' },
                    { label: 'Assignment',    value: 'ROS REST Adapter' },
                    { label: 'Notifications', value: 'RabbitMQ Queue' },
                    { label: 'Order Record',  value: 'CMS SOAP + DB' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'Courier New, monospace', fontSize: 11 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof of delivery preview — shown when delivered */}
              {selected?.status?.toLowerCase() === 'delivered' && (
                <div className="pod-preview-card">
                  <div className="pod-preview-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" /><polyline points="9 15 11 17 15 13" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#4ade80', marginBottom: 3 }}>
                      Delivery Confirmed
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Your package was successfully delivered. Proof of delivery has been recorded.
                    </div>
                  </div>
                </div>
              )}

              {/* Next step hint — shown for active orders */}
              {selected && !['delivered','delivery_failed','failed'].includes(selected.status?.toLowerCase()) && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(249,115,22,0.05)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    <strong style={{ color: 'var(--accent)' }}>Next step:</strong>{' '}
                    {selected.status?.toLowerCase() === 'pending' && 'Waiting for ROS to assign a driver to your delivery.'}
                    {selected.status?.toLowerCase() === 'assigned' && 'Driver is preparing for pickup — your order will be dispatched soon.'}
                    {selected.status?.toLowerCase() === 'dispatched' && 'Your order is out for delivery! The driver is en route.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
