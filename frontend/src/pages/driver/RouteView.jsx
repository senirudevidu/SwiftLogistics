import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'
import { formatDate } from '../../lib/utils'

const ACTIVE_STATUSES = ['assigned', 'dispatched']

function RouteMapPlaceholder({ order }) {
  const pts = [
    [40, 280], [120, 210], [190, 150], [260, 95], [330, 50],
  ]

  return (
    <div className="route-map-placeholder">
      <div className="route-map-bg" />

      {/* SVG route */}
      <svg className="route-path-svg" viewBox="0 0 380 330" fill="none">
        {/* Dashed route path */}
        <path
          d="M40 280 C 100 240, 160 200, 190 160 S 280 90, 330 50"
          stroke="rgba(249,115,22,0.5)"
          strokeWidth="2.5"
          strokeDasharray="8 5"
        />
        {/* Points */}
        {pts.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="5"  fill={i === pts.length - 1 ? '#4ade80' : 'rgba(249,115,22,0.75)'} />
            <circle cx={cx} cy={cy} r="12" fill={i === pts.length - 1 ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.1)'} />
          </g>
        ))}
        {/* Current truck position */}
        <g transform="translate(175,165)">
          <rect x="-14" y="-9" width="22" height="11" rx="2.5" fill="var(--accent)" />
          <polygon points="-14,-9 -14,2 -20,-4" fill="var(--accent)" />
          <circle cx="-8" cy="4" r="3.5" fill="#1a1d24" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="6" cy="4" r="3.5" fill="#1a1d24" stroke="var(--accent)" strokeWidth="1.5" />
        </g>

        {/* Labels */}
        <text x="22" y="275" fill="rgba(249,115,22,0.7)" fontSize="10" fontFamily="Inter, sans-serif">Depot</text>
        <text x="308" y="46"  fill="#4ade80"              fontSize="10" fontFamily="Inter, sans-serif">Destination</text>
      </svg>

      {/* Overlay info */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Destination</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{order?.delivery_address || '—'}</div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: '10px 14px', minWidth: 90, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>ETA</div>
          <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>~35 min</div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        Route Preview (ROS)
      </div>
    </div>
  )
}

export default function RouteView() {
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const navigate                = useNavigate()
  const { toast }               = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getMyJobs()
      const all    = Array.isArray(res.data) ? res.data : []
      const active = all.filter(o => ACTIVE_STATUSES.includes(o.status?.toLowerCase()))
      setJobs(active)
      setSelected(prev => prev ? (active.find(o => o.order_id === prev.order_id) || active[0] || null) : (active[0] || null))
    } catch {
      toast('Failed to load route data', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const meta = selected ? getStatusMeta(selected.status) : null

  return (
    <AppLayout role="driver">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Route View</h1>
          <p className="admin-page-subtitle">
            Active delivery routes calculated by the ROS Route Optimization System
          </p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-icon-outline" onClick={load} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            className="btn-accent"
            style={{ fontSize: 12 }}
            onClick={() => navigate('/driver/proof-of-delivery', selected ? { state: { orderId: selected.order_id } } : {})}
            disabled={!selected}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Submit Proof
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <span className="spinner" style={{ display: 'inline-block', marginRight: 10 }} />
          Loading routes…
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No active routes
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            You have no assigned or dispatched deliveries at the moment.
          </div>
          <button className="btn-secondary" onClick={() => navigate('/driver/jobs')}>
            View All Jobs
          </button>
        </div>
      ) : (
        <>
          {/* Order selector strip */}
          {jobs.length > 1 && (
            <div style={{ padding: '0 36px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {jobs.map(j => {
                const m = getStatusMeta(j.status)
                const isSel = selected?.order_id === j.order_id
                return (
                  <button
                    key={j.order_id}
                    onClick={() => setSelected(j)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${isSel ? m.color : 'var(--border)'}`,
                      background: isSel ? m.bg : 'var(--bg-card)',
                      color: isSel ? m.color : 'var(--text-secondary)',
                      fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600,
                    }}
                  >
                    #{j.order_id}
                  </button>
                )
              })}
            </div>
          )}

          <div className="route-layout">
            {/* ── Map ── */}
            <RouteMapPlaceholder order={selected} />

            {/* ── Details panel ── */}
            {selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status card */}
                <div className="admin-card" style={{ margin: 0 }}>
                  <div style={{ padding: '16px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="order-id-badge">#{selected.order_id}</span>
                      <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    {[
                      { label: 'Delivery Address', value: selected.delivery_address || '—' },
                      { label: 'Assigned',         value: formatDate(selected.created_at) },
                      { label: 'Product ID',        value: selected.product_id ?? '—' },
                      { label: 'Client',            value: `Client #${selected.client_id || '—'}` },
                    ].map(row => (
                      <div key={row.label} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                          {row.label}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route info */}
                <div className="admin-card" style={{ margin: 0, padding: '16px 22px' }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Route Information
                  </div>
                  {[
                    { label: 'Source',      value: 'ROS REST API' },
                    { label: 'Distance',    value: '~12.4 km' },
                    { label: 'Duration',    value: '~35 min' },
                    { label: 'Traffic',     value: 'Moderate' },
                    { label: 'Optimised',   value: 'Yes (ROS)' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{r.label}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Navigation links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn-accent"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selected.delivery_address || '')}`, '_blank')}
                    disabled={!selected.delivery_address}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Open in Google Maps
                  </button>
                  <button
                    className="btn-outline-accent"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate('/driver/proof-of-delivery', { state: { orderId: selected.order_id } })}
                  >
                    Submit Proof of Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}
