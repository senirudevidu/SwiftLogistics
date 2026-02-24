import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { orderAPI } from '../../api'
import { useToast } from '../../context/ToastContext'

/* ── Submission phases ──────────────────────────────────────────────────────
   null        → idle (form visible)
   'submitting'→ phase 1 active  (API call started)
   'processing'→ phase 2 active  (≥650ms elapsed)
   'confirming'→ phase 3 active  (≥1300ms elapsed)
   'success'   → order placed, show confirmation
   ──────────────────────────────────────────────────────────────────────────*/
const PHASE_DELAYS = [0, 650, 1300]

const PRIORITIES = [
  {
    id: 'standard',
    label: 'Standard',
    eta: '3–5 days',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    id: 'express',
    label: 'Express',
    eta: '1–2 days',
    color: 'var(--accent)',
    bg: 'rgba(249,115,22,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    id: 'priority',
    label: 'Priority',
    eta: 'Same day',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

const SUBMIT_STEPS = [
  { id: 'submitting', label: 'Submitting order to gateway…' },
  { id: 'processing', label: 'Processing via middleware queue…' },
  { id: 'confirming', label: 'Awaiting order confirmation…' },
]

const INITIAL_FORM = { delivery_address: '', product_id: '', notes: '' }

export default function NewOrder() {
  const [form, setForm]         = useState(INITIAL_FORM)
  const [priority, setPriority] = useState('standard')
  const [errors, setErrors]     = useState({})
  const [phase, setPhase]       = useState(null)
  const [orderId, setOrderId]   = useState(null)
  const timerRefs               = useRef([])
  const navigate                = useNavigate()
  const { toast }               = useToast()

  useEffect(() => () => timerRefs.current.forEach(clearTimeout), [])

  const validate = () => {
    const e = {}
    if (!form.delivery_address.trim()) e.delivery_address = 'Delivery address is required.'
    if (!form.product_id) {
      e.product_id = 'Product ID is required.'
    } else if (isNaN(Number(form.product_id)) || Number(form.product_id) < 1) {
      e.product_id = 'Enter a valid numeric Product ID (≥ 1).'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setPhase('submitting')
    const t1 = setTimeout(() => setPhase('processing'), PHASE_DELAYS[1])
    const t2 = setTimeout(() => setPhase('confirming'), PHASE_DELAYS[2])
    timerRefs.current = [t1, t2]
    try {
      const res = await orderAPI.submitOrder({
        delivery_address: form.delivery_address.trim(),
        product_id: Number(form.product_id),
      })
      timerRefs.current.forEach(clearTimeout)
      setOrderId(res.data?.order_id || null)
      setPhase('success')
    } catch (err) {
      timerRefs.current.forEach(clearTimeout)
      setPhase(null)
      const msg = err.response?.data?.detail || 'Failed to place order. Please try again.'
      toast(msg, 'error')
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setPriority('standard')
    setErrors({})
    setPhase(null)
    setOrderId(null)
  }

  const isSubmitting = phase !== null && phase !== 'success'
  const phaseIndex   = ['submitting', 'processing', 'confirming'].indexOf(phase)

  /* ── Success screen ── */
  if (phase === 'success') {
    return (
      <AppLayout role="client">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Order Submitted</h1>
            <p className="admin-page-subtitle">Your shipment request has been processed.</p>
          </div>
        </div>
        <div style={{ padding: '0 36px 36px' }}>
          <div className="admin-card" style={{ margin: 0, maxWidth: 540 }}>
            <div className="order-success-banner">
              <div className="success-ring">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Order Confirmed!
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Your order has been queued through the SwiftLogistics gateway and is being processed.
                </div>
              </div>
              {orderId && <div className="success-order-chip">Order #{orderId}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 380, textAlign: 'center' }}>
                A driver will be assigned automatically by the ROS routing system.
                You can track your order in real-time from the tracking page.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn-secondary" onClick={handleReset}>Place Another</button>
                <button className="btn-accent" onClick={() => navigate('/client/tracking')}>
                  Track This Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  /* ── Main form ── */
  return (
    <AppLayout role="client">
      <div className="admin-topbar">
        <div>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <h1 className="admin-page-title" style={{ marginTop: 8 }}>Submit New Order</h1>
          <p className="admin-page-subtitle">Fill in the details below to place a new shipment request.</p>
        </div>
      </div>

      <div className="form-page-grid" style={{ padding: '0 36px 36px' }}>
        {/* ── Form card ── */}
        <div className="admin-card" style={{ margin: 0 }}>
          {isSubmitting ? (
            /* ── Progress overlay ── */
            <div style={{ padding: '32px 28px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
                Processing your order…
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 26 }}>
                Submitting to the SwiftLogistics middleware gateway
              </div>
              <div className="submit-progress">
                {SUBMIT_STEPS.map((step, i) => {
                  const isDone   = i < phaseIndex
                  const isActive = i === phaseIndex
                  return (
                    <div key={step.id} className={`submit-step ${isActive ? 'submit-step--active' : isDone ? 'submit-step--done' : ''}`}>
                      <div className="submit-step-dot">
                        {isDone ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : isActive ? (
                          <span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(249,115,22,0.3)', borderTopColor: 'var(--accent)' }} />
                        ) : null}
                      </div>
                      <div className="submit-step-text">{step.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ padding: '22px 24px' }}>
              {/* ── Section 1: Shipment Details ── */}
              <div className="order-form-section">
                <div className="order-form-section-header">
                  <span className="order-form-section-num">1</span>
                  <span className="order-form-section-title">Shipment Details</span>
                </div>
                <div className="form-group">
                  <label htmlFor="delivery_address">
                    Delivery Address <em className="required-star">*</em>
                  </label>
                  <input
                    id="delivery_address"
                    name="delivery_address"
                    type="text"
                    placeholder="e.g. 42 Market Street, London, EC1A 1BB"
                    value={form.delivery_address}
                    onChange={handleChange}
                    aria-invalid={!!errors.delivery_address}
                    style={errors.delivery_address ? { borderColor: 'var(--error)' } : {}}
                  />
                  {errors.delivery_address && (
                    <span style={{ fontSize: 12, color: 'var(--error)' }}>{errors.delivery_address}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="product_id">
                    Product ID <em className="required-star">*</em>
                  </label>
                  <input
                    id="product_id"
                    name="product_id"
                    type="number"
                    min="1"
                    placeholder="e.g. 101"
                    value={form.product_id}
                    onChange={handleChange}
                    aria-invalid={!!errors.product_id}
                    style={errors.product_id ? { borderColor: 'var(--error)' } : {}}
                  />
                  {errors.product_id && (
                    <span style={{ fontSize: 12, color: 'var(--error)' }}>{errors.product_id}</span>
                  )}
                </div>
              </div>

              {/* ── Section 2: Priority ── */}
              <div className="order-form-section">
                <div className="order-form-section-header">
                  <span className="order-form-section-num">2</span>
                  <span className="order-form-section-title">Delivery Priority</span>
                </div>
                <div className="priority-selector">
                  {PRIORITIES.map(p => (
                    <div
                      key={p.id}
                      className={`priority-option ${priority === p.id ? 'priority-option--active' : ''}`}
                      onClick={() => setPriority(p.id)}
                      role="radio"
                      aria-checked={priority === p.id}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setPriority(p.id)}
                    >
                      <div className="priority-option-icon" style={{ background: p.bg, color: p.color }}>
                        {p.icon}
                      </div>
                      <div className="priority-option-label">{p.label}</div>
                      <div className="priority-option-eta">{p.eta}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Priority is indicative. Actual routing is managed by the ROS middleware system.
                </div>
              </div>

              {/* ── Section 3: Notes ── */}
              <div className="order-form-section" style={{ marginBottom: 0 }}>
                <div className="order-form-section-header">
                  <span className="order-form-section-num">3</span>
                  <span className="order-form-section-title">Additional Notes</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Optional</span>
                </div>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Special delivery instructions or additional information…"
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    padding: '11px 14px',
                    color: 'var(--text-primary)',
                    fontSize: 13.5,
                    fontFamily: 'var(--font-body)',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              <div className="form-actions" style={{ marginTop: 26 }}>
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Place Order
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="form-info-panel">
          <div className="info-panel-title">How it works</div>
          <ul className="info-panel-list">
            <li>Enter a valid delivery address and product ID.</li>
            <li>Your order is queued via the <strong>API Gateway</strong>.</li>
            <li>The <strong>CMS adapter</strong> logs the order record.</li>
            <li>The <strong>ROS adapter</strong> assigns a driver automatically.</li>
            <li>The <strong>WMS adapter</strong> notifies the warehouse system.</li>
            <li>Track progress in real-time on the <strong>Track Order</strong> page.</li>
          </ul>
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
              Priority Guide
            </div>
            {PRIORITIES.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{p.eta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
