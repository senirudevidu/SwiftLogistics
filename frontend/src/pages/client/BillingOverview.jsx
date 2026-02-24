import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { orderAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

/* ── Mock billing config ───────────────────────────────────────────────────── */
const BASE_RATE  = 8.50   // per order (£)
const WEIGHT_FEE = 2.20   // per order (mock)
const TAX_RATE   = 0.15   // 15% GST

function calcOrder(order) {
  const subtotal = BASE_RATE + WEIGHT_FEE
  const tax      = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const total    = parseFloat((subtotal + tax).toFixed(2))
  return { subtotal, tax, total }
}

function fmt(n) {
  return `$${n.toFixed(2)}`
}

function fmtMonth(dateStr) {
  if (!dateStr) return 'Unknown'
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(dateStr))
  } catch { return dateStr }
}

function getMonth(dateStr) {
  try { return new Date(dateStr).toISOString().slice(0, 7) } catch { return '' }
}

export default function BillingOverview() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const { toast }             = useToast()
  const navigate              = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderAPI.getMyOrders()
        setOrders(Array.isArray(res.data) ? res.data : [])
      } catch {
        toast('Failed to load billing data', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Derived stats ── */
  const invoices = useMemo(() =>
    orders.map(o => ({
      ...o,
      ...calcOrder(o),
      paid: o.status === 'delivered',
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  [orders])

  const totalSpend   = invoices.reduce((s, i) => s + i.total, 0)
  const paidTotal    = invoices.filter(i => i.paid).reduce((s, i) => s + i.total, 0)
  const pendingTotal = invoices.filter(i => !i.paid).reduce((s, i) => s + i.total, 0)

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const map = {}
    invoices.forEach(inv => {
      const m = getMonth(inv.created_at)
      if (!m) return
      map[m] = (map[m] || 0) + inv.total
    })
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .reverse()
  }, [invoices])

  const maxMonth = monthlyData.length ? Math.max(...monthlyData.map(([, v]) => v)) : 1

  return (
    <AppLayout role="client">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Billing Overview</h1>
          <p className="admin-page-subtitle">
            Order spend summary and invoice history via CMS billing integration
          </p>
        </div>
        <div className="admin-topbar-actions">
          <button
            className="btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => toast('PDF export coming soon', 'info')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          {
            label: 'Total Spend',
            value: loading ? '—' : fmt(totalSpend),
            color: 'var(--accent)',
            bg: 'rgba(249,115,22,0.12)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          },
          {
            label: 'Orders',
            value: loading ? '—' : invoices.length,
            color: '#818cf8',
            bg: 'rgba(99,102,241,0.12)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            ),
          },
          {
            label: 'Paid',
            value: loading ? '—' : fmt(paidTotal),
            color: '#4ade80',
            bg: 'rgba(34,197,94,0.12)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          },
          {
            label: 'Pending',
            value: loading ? '—' : fmt(pendingTotal),
            color: '#eab308',
            bg: 'rgba(234,179,8,0.12)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
        ].map(s => (
          <div className="stat-card-v2" key={s.label}>
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-card-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="billing-layout">
        {/* ── Monthly spend chart ── */}
        {monthlyData.length > 0 && (
          <div className="admin-card" style={{ margin: 0 }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>Monthly Spend</span>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {monthlyData.map(([month, value]) => (
                <div key={month} className="billing-month-bar">
                  <div className="billing-month-label">
                    <span>{fmtMonth(month + '-01')}</span>
                    <span style={{ color: 'var(--accent)' }}>{fmt(value)}</span>
                  </div>
                  <div className="billing-bar-track">
                    <div
                      className="billing-bar-fill"
                      style={{ width: `${Math.round((value / maxMonth) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rate card ── */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>Pricing Structure</span>
          </div>
          <div style={{ padding: '16px 22px' }}>
            {[
              { label: 'Base Delivery Rate', value: fmt(BASE_RATE) },
              { label: 'Handling Fee',        value: fmt(WEIGHT_FEE) },
              { label: 'Subtotal per Order',  value: fmt(BASE_RATE + WEIGHT_FEE) },
              { label: 'GST (15%)',           value: fmt((BASE_RATE + WEIGHT_FEE) * TAX_RATE) },
              { label: 'Total per Order',     value: fmt((BASE_RATE + WEIGHT_FEE) * (1 + TAX_RATE)), highlight: true },
            ].map(r => (
              <div
                key={r.label}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '9px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: r.highlight ? 700 : 500, color: r.highlight ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 22px 18px' }}>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Billing is managed through the <strong style={{ color: 'var(--text-secondary)' }}>CMS SOAP integration</strong>.
              Invoices are generated automatically upon order creation and marked as paid when delivery is confirmed.
            </p>
          </div>
        </div>

        {/* ── Invoice table ── */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
              Invoice History
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="table-empty">
              <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
              Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="table-empty">No invoices yet. Place your first order to generate an invoice.</div>
          ) : invoices.map(inv => (
            <div key={inv.order_id} className="invoice-row">
              <div
                className="invoice-icon"
                style={{
                  background: inv.paid ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  color: inv.paid ? '#4ade80' : '#eab308',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                  INV-{String(inv.order_id).padStart(5, '0')}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                    Order #{inv.order_id}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {formatDate(inv.created_at)}
                </div>
              </div>
              <span
                className="status-pill-custom"
                style={{
                  background: inv.paid ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  color: inv.paid ? '#4ade80' : '#eab308',
                  fontSize: 10.5,
                  marginRight: 8,
                }}
              >
                {inv.paid ? 'Paid' : 'Pending'}
              </span>
              <span className="invoice-amount" style={{ marginRight: 8 }}>{fmt(inv.total)}</span>
              <button
                className="invoice-download-btn"
                title="Download invoice (PDF)"
                onClick={() => toast(`Invoice INV-${String(inv.order_id).padStart(5, '0')} — PDF export coming soon`, 'info')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
