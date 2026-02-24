import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { adminAPI } from '../../api'
import { useToast } from '../../context/ToastContext'

/* ── Mock service definitions ─────────────────────────────────────────────── */
const SERVICES = [
  {
    key: 'cms',
    name: 'CMS',
    fullName: 'Customer Management System',
    protocol: 'SOAP / XML',
    port: '8080',
    color: '#818cf8',
    icon: '🔗',
    description: 'Handles client data, order creation, and billing via SOAP web services.',
  },
  {
    key: 'ros',
    name: 'ROS',
    fullName: 'Route Optimization System',
    protocol: 'REST / HTTP',
    port: '8081',
    color: '#34d399',
    icon: '🛣️',
    description: 'Calculates optimal delivery routes and manages driver assignments via REST API.',
  },
  {
    key: 'wms',
    name: 'WMS',
    fullName: 'Warehouse Management System',
    protocol: 'TCP / JSON',
    port: '9000',
    color: '#fbbf24',
    icon: '📦',
    description: 'Manages inventory, warehouse operations, and stock levels via TCP messaging.',
  },
  {
    key: 'queue',
    name: 'Message Queue',
    fullName: 'RabbitMQ Broker',
    protocol: 'AMQP',
    port: '5672',
    color: '#f97316',
    icon: '⚡',
    description: 'Async message broker for inter-service communication and event streaming.',
  },
]

/* ── Mock event log ───────────────────────────────────────────────────────── */
const SEED_EVENTS = [
  { time: '08:42:11', service: 'CMS',   level: 'INFO',  msg: 'SOAP endpoint healthy — response 200 ms' },
  { time: '08:41:55', service: 'ROS',   level: 'INFO',  msg: 'Route optimisation batch completed (12 routes)' },
  { time: '08:40:03', service: 'WMS',   level: 'WARN',  msg: 'TCP socket reconnect attempt #2' },
  { time: '08:39:47', service: 'Queue', level: 'INFO',  msg: '3 messages consumed from order.created queue' },
  { time: '08:38:30', service: 'ROS',   level: 'INFO',  msg: 'Driver #7 assigned to Order #214' },
  { time: '08:37:12', service: 'CMS',   level: 'INFO',  msg: 'New client registration received via SOAP' },
  { time: '08:36:44', service: 'WMS',   level: 'INFO',  msg: 'Inventory sync complete — 420 SKUs updated' },
  { time: '08:35:20', service: 'Queue', level: 'WARN',  msg: 'Dead-letter queue depth: 3 messages' },
  { time: '08:34:05', service: 'CMS',   level: 'ERROR', msg: 'SOAP timeout on /GetClientStatus — retrying' },
  { time: '08:33:51', service: 'ROS',   level: 'INFO',  msg: 'Health check passed — latency 48 ms' },
]

function genLatency(base) {
  return Math.round(base + Math.random() * 40 - 20)
}

function genMetrics() {
  return {
    cms:   { latency: genLatency(95),  requests: 142 + Math.floor(Math.random() * 30), uptime: '99.8%', status: 'online' },
    ros:   { latency: genLatency(52),  requests: 389 + Math.floor(Math.random() * 50), uptime: '99.9%', status: 'online' },
    wms:   { latency: genLatency(210), requests: 87  + Math.floor(Math.random() * 20), uptime: '97.4%', status: 'online' },
    queue: { latency: genLatency(8),   requests: 1240 + Math.floor(Math.random() * 80), uptime: '99.99%', status: 'online' },
  }
}

function StatusBadge({ status }) {
  const cls =
    status === 'online'   ? 'health-status-badge--online' :
    status === 'degraded' ? 'health-status-badge--degraded' :
                             'health-status-badge--offline'
  const label =
    status === 'online' ? 'Online' : status === 'degraded' ? 'Degraded' : 'Offline'

  return (
    <span className={`health-status-badge ${cls}`}>
      <span className="health-status-dot" />
      {label}
    </span>
  )
}

function ServiceCard({ svc, metrics }) {
  const m = metrics[svc.key] || {}
  return (
    <div
      className="health-card"
      style={{ '--service-color': svc.color }}
    >
      <div className="health-card-header">
        <div className="health-service-icon" style={{ background: `${svc.color}1a`, fontSize: 24 }}>
          {svc.icon}
        </div>
        <StatusBadge status={m.status || 'online'} />
      </div>

      <div className="health-card-name">{svc.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
        <span className="health-card-protocol">{svc.protocol}</span>
        <span style={{ width: 3, height: 3, background: 'var(--text-muted)', borderRadius: '50%' }} />
        <span className="health-card-protocol">Port {svc.port}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.55 }}>
        {svc.description}
      </p>

      <div className="health-metrics">
        <div className="health-metric">
          <span className="health-metric-label">Latency</span>
          <span
            className="health-metric-value"
            style={{ color: m.latency > 150 ? '#fbbf24' : '#4ade80' }}
          >
            {m.latency ?? '—'} ms
          </span>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Uptime</span>
          <span className="health-metric-value">{m.uptime ?? '—'}</span>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Requests</span>
          <span className="health-metric-value">{m.requests?.toLocaleString() ?? '—'}</span>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Last check</span>
          <span className="health-metric-value" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ServiceHealth() {
  const [metrics, setMetrics]     = useState(genMetrics())
  const [events, setEvents]       = useState(SEED_EVENTS)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats]         = useState({ clients: 0, drivers: 0, orders: 0 })
  const intervalRef               = useRef(null)
  const { toast }                 = useToast()

  // Load real counts from API
  useEffect(() => {
    Promise.allSettled([adminAPI.getClients(), adminAPI.getDrivers(), adminAPI.getOrders()]).then(
      ([c, d, o]) => {
        setStats({
          clients: c.status === 'fulfilled' ? c.value.data.length : 0,
          drivers: d.status === 'fulfilled' ? d.value.data.length : 0,
          orders:  o.status === 'fulfilled' ? (Array.isArray(o.value.data) ? o.value.data.length : 0) : 0,
        })
      },
    )
  }, [])

  const doRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setMetrics(genMetrics())
      const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setEvents(prev => [
        {
          time: now,
          service: ['CMS', 'ROS', 'WMS', 'Queue'][Math.floor(Math.random() * 4)],
          level: Math.random() > 0.85 ? 'WARN' : 'INFO',
          msg: [
            'Health check passed successfully',
            'Connection pool healthy',
            'Message processed from queue',
            'Heartbeat acknowledged',
            'Sync completed — no drift detected',
          ][Math.floor(Math.random() * 5)],
        },
        ...prev.slice(0, 19),
      ])
      setRefreshing(false)
    }, 700)
  }, [])

  // Auto-refresh every 30 s
  useEffect(() => {
    intervalRef.current = setInterval(doRefresh, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [doRefresh])

  const onlineCount = SERVICES.filter(s => (metrics[s.key]?.status ?? 'online') === 'online').length
  const avgLatency  = Math.round(
    SERVICES.reduce((sum, s) => sum + (metrics[s.key]?.latency ?? 0), 0) / SERVICES.length,
  )

  return (
    <AppLayout role="admin">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Service Health</h1>
          <p className="admin-page-subtitle">
            Real-time middleware integration status — CMS · ROS · WMS · Message Queue
          </p>
        </div>
        <div className="admin-topbar-actions">
          <span className="live-badge">
            <span className="live-badge-dot" />
            Live
          </span>
          <button
            className="btn-icon-outline"
            onClick={doRefresh}
            disabled={refreshing}
            title="Refresh metrics"
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
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value" style={{ color: '#4ade80' }}>{onlineCount}/{SERVICES.length}</div>
            <div className="stat-card-label">Services Online</div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{avgLatency} ms</div>
            <div className="stat-card-label">Avg Latency</div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{stats.clients + stats.drivers}</div>
            <div className="stat-card-label">Active Users</div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{stats.orders}</div>
            <div className="stat-card-label">Orders Processed</div>
          </div>
        </div>
      </div>

      {/* ── Service Cards ── */}
      <div className="health-grid">
        {SERVICES.map(svc => (
          <ServiceCard key={svc.key} svc={svc} metrics={metrics} />
        ))}
      </div>

      {/* ── Event log ── */}
      <div className="admin-card" style={{ margin: '0 36px 36px' }}>
        <div className="admin-card-header">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
            System Event Log
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Last {events.length} events · auto-refresh 30s
          </span>
        </div>
        <div className="health-event-list">
          {events.map((ev, i) => {
            const levelColor =
              ev.level === 'ERROR' ? '#f87171' :
              ev.level === 'WARN'  ? '#fde047' :
              '#a5b4fc'
            return (
              <div key={i} className="health-event-row">
                <span className="health-event-time">{ev.time}</span>
                <span
                  className="health-event-service"
                  style={{ color: levelColor }}
                >
                  {ev.service}
                </span>
                <span
                  className="log-level-badge"
                  style={{
                    background: ev.level === 'ERROR' ? 'rgba(239,68,68,0.12)' :
                                ev.level === 'WARN'  ? 'rgba(234,179,8,0.12)' :
                                                       'rgba(99,102,241,0.12)',
                    color: levelColor,
                    border: `1px solid ${levelColor}40`,
                    fontSize: 10,
                    padding: '2px 7px',
                  }}
                >
                  {ev.level}
                </span>
                <span className="health-event-msg">{ev.msg}</span>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
