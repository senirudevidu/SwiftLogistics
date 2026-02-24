import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '../../layouts/AppLayout'

/* ── Static seed log bank ──────────────────────────────────────────────────── */
const LOG_BANK = [
  { id: 1,  ts: '2026-02-25T08:44:12Z', svc: 'gateway',    level: 'INFO',  msg: 'POST /order → order-service — 201 Created — 34 ms' },
  { id: 2,  ts: '2026-02-25T08:44:10Z', svc: 'auth',       level: 'INFO',  msg: 'JWT issued for user "alice_client" (role=client)' },
  { id: 3,  ts: '2026-02-25T08:43:55Z', svc: 'order',      level: 'INFO',  msg: 'Order #218 created — routed to ROS adapter' },
  { id: 4,  ts: '2026-02-25T08:43:50Z', svc: 'ros_adapter',level: 'INFO',  msg: 'REST call to ROS /assign-driver succeeded — driver #4' },
  { id: 5,  ts: '2026-02-25T08:43:40Z', svc: 'wms_adapter',level: 'WARN',  msg: 'TCP socket stale — reconnecting to WMS on :9000' },
  { id: 6,  ts: '2026-02-25T08:43:38Z', svc: 'wms_adapter',level: 'INFO',  msg: 'TCP socket reconnected successfully' },
  { id: 7,  ts: '2026-02-25T08:43:15Z', svc: 'cms_adapter',level: 'INFO',  msg: 'SOAP GetClientStatus — client #12 — 200 OK — 88 ms' },
  { id: 8,  ts: '2026-02-25T08:42:58Z', svc: 'queue',      level: 'INFO',  msg: 'order.created event published to RabbitMQ (exchange: logistics)' },
  { id: 9,  ts: '2026-02-25T08:42:44Z', svc: 'driver',     level: 'INFO',  msg: 'Driver #4 status updated → dispatched for Order #217' },
  { id: 10, ts: '2026-02-25T08:42:30Z', svc: 'order',      level: 'ERROR', msg: 'Order #216 assignment failed — no available drivers in zone' },
  { id: 11, ts: '2026-02-25T08:42:20Z', svc: 'gateway',    level: 'INFO',  msg: 'GET /driver/orders → driver-service — 200 — 12 ms' },
  { id: 12, ts: '2026-02-25T08:42:00Z', svc: 'auth',       level: 'WARN',  msg: 'Invalid login attempt for user "unknown123" — IP 192.168.1.44' },
  { id: 13, ts: '2026-02-25T08:41:45Z', svc: 'ros_adapter',level: 'INFO',  msg: 'Route optimised: A→B→C — estimated 47 min' },
  { id: 14, ts: '2026-02-25T08:41:30Z', svc: 'cms_adapter',level: 'ERROR', msg: 'SOAP fault: Server.ServiceUnavailable — retry 1/3' },
  { id: 15, ts: '2026-02-25T08:41:28Z', svc: 'cms_adapter',level: 'INFO',  msg: 'SOAP retry successful — response 210 ms' },
  { id: 16, ts: '2026-02-25T08:41:10Z', svc: 'order',      level: 'INFO',  msg: 'Order #215 status → delivered — CMS notified' },
  { id: 17, ts: '2026-02-25T08:40:55Z', svc: 'wms_adapter',level: 'INFO',  msg: 'Inventory check OK for product_id=42 — stock: 18 units' },
  { id: 18, ts: '2026-02-25T08:40:40Z', svc: 'queue',      level: 'WARN',  msg: 'Consumer lag 3s on order.status_updated queue' },
  { id: 19, ts: '2026-02-25T08:40:20Z', svc: 'gateway',    level: 'INFO',  msg: 'PUT /driver/orders/215/status — 200 — 18 ms' },
  { id: 20, ts: '2026-02-25T08:40:00Z', svc: 'admin',      level: 'INFO',  msg: 'Admin "superadmin" fetched clients list — 12 records' },
  { id: 21, ts: '2026-02-25T08:39:45Z', svc: 'auth',       level: 'INFO',  msg: 'Token refreshed for user "bob_driver"' },
  { id: 22, ts: '2026-02-25T08:39:30Z', svc: 'ros_adapter',level: 'WARN',  msg: 'ROS response slow — latency 420 ms (threshold: 300 ms)' },
  { id: 23, ts: '2026-02-25T08:39:10Z', svc: 'order',      level: 'INFO',  msg: 'Order #214 assigned to driver #7 via ROS recommendation' },
  { id: 24, ts: '2026-02-25T08:38:55Z', svc: 'cms_adapter',level: 'INFO',  msg: 'SOAP CreateOrder envelope processed — order_ref: ORD-2024-214' },
  { id: 25, ts: '2026-02-25T08:38:40Z', svc: 'wms_adapter',level: 'INFO',  msg: 'TCP message: RESERVE_STOCK product=42 qty=1 — ACK received' },
]

const SERVICES_LIST = ['all', 'gateway', 'auth', 'order', 'driver', 'admin', 'ros_adapter', 'cms_adapter', 'wms_adapter', 'queue']
const LEVELS_LIST   = ['ALL', 'INFO', 'WARN', 'ERROR']

const PAGE_SIZE = 15

function LevelBadge({ level }) {
  const cls =
    level === 'ERROR' ? 'log-level-badge--error' :
    level === 'WARN'  ? 'log-level-badge--warn'  :
    level === 'DEBUG' ? 'log-level-badge--debug' :
    'log-level-badge--info'
  return <span className={`log-level-badge ${cls}`}>{level}</span>
}

function fmtTs(ts) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(ts))
  } catch { return ts }
}

export default function SystemLogs() {
  const [logs, setLogs]           = useState(LOG_BANK)
  const [search, setSearch]       = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [svcFilter, setSvcFilter] = useState('all')
  const [page, setPage]           = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  const doRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      const now = new Date().toISOString()
      const newEntries = [
        {
          id: Date.now(),
          ts: now,
          svc: ['gateway', 'order', 'queue', 'ros_adapter'][Math.floor(Math.random() * 4)],
          level: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'WARN' : 'ERROR') : 'INFO',
          msg: [
            'Heartbeat acknowledged',
            'Message queue depth nominal (0)',
            'Route assignment completed',
            'Health check passed',
            'Connection pool healthy — 5/10 active',
          ][Math.floor(Math.random() * 5)],
        },
      ]
      setLogs(prev => [...newEntries, ...prev].slice(0, 200))
      setRefreshing(false)
    }, 500)
  }, [])

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoScroll) return
    const t = setInterval(doRefresh, 15_000)
    return () => clearInterval(t)
  }, [doRefresh, autoScroll])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      const matchSearch = !q || l.msg.toLowerCase().includes(q) || l.svc.includes(q)
      const matchLevel  = levelFilter === 'ALL' || l.level === levelFilter
      const matchSvc    = svcFilter === 'all' || l.svc === svcFilter
      return matchSearch && matchLevel && matchSvc
    })
  }, [logs, search, levelFilter, svcFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const levelCounts = useMemo(() =>
    logs.reduce((a, l) => ({ ...a, [l.level]: (a[l.level] || 0) + 1 }), {}),
  [logs])

  return (
    <AppLayout role="admin">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">System Logs</h1>
          <p className="admin-page-subtitle">
            Audit trail of all middleware operations, API calls, and service events
          </p>
        </div>
        <div className="admin-topbar-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            Auto-refresh
          </label>
          <button
            className="btn-icon-outline"
            onClick={doRefresh}
            disabled={refreshing}
            title="Refresh logs"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => {
              const csv = ['timestamp,service,level,message', ...logs.map(l => `${l.ts},${l.svc},${l.level},"${l.msg.replace(/"/g,'""')}"`)]
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement('a'); a.href = url; a.download = 'system-logs.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Level summary ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Entries', value: logs.length,                 color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)' },
          { label: 'Info',          value: levelCounts.INFO  || 0,      color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Warnings',      value: levelCounts.WARN  || 0,      color: '#fde047', bg: 'rgba(234,179,8,0.12)'  },
          { label: 'Errors',        value: levelCounts.ERROR || 0,      color: '#f87171', bg: 'rgba(239,68,68,0.12)'  },
        ].map(s => (
          <div className="stat-card-v2" key={s.label}>
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Table ── */}
      <div className="admin-card" style={{ margin: '0 36px 36px' }}>
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          {/* Search */}
          <div className="search-input-wrap" style={{ flex: '1 1 200px', minWidth: 180 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              placeholder="Search messages or services…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Level filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {LEVELS_LIST.map(l => (
              <button
                key={l}
                className={`filter-pill ${levelFilter === l ? 'filter-pill--active' : ''}`}
                onClick={() => { setLevelFilter(l); setPage(1) }}
                style={{ fontSize: 11, padding: '5px 11px' }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Service filter */}
          <select
            value={svcFilter}
            onChange={e => { setSvcFilter(e.target.value); setPage(1) }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '7px 10px',
              color: 'var(--text-primary)',
              fontSize: 12.5,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            {SERVICES_LIST.map(s => <option key={s} value={s}>{s === 'all' ? 'All Services' : s}</option>)}
          </select>

          <span className="table-result-count">{filtered.length} entries</span>
        </div>

        {/* Log table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 78 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Service</th>
                <th>Level</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-empty">No log entries match the current filters.</td>
                </tr>
              ) : paginated.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'Courier New, monospace', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {fmtTs(log.ts)}
                  </td>
                  <td>
                    <span className="log-service-tag">{log.svc}</span>
                  </td>
                  <td>
                    <LevelBadge level={log.level} />
                  </td>
                  <td>
                    <span
                      className={`log-message ${log.level === 'ERROR' ? 'log-message--error' : log.level === 'WARN' ? 'log-message--warn' : ''}`}
                    >
                      {log.msg}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-footer">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div className="pagination">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pg-btn ${p === page ? 'pg-btn--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
