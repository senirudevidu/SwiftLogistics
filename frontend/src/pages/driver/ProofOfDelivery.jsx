import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { driverAPI } from '../../api'
import { useToast } from '../../context/ToastContext'
import { getStatusMeta } from '../../lib/status'

const ACTIVE_STATUSES = ['assigned', 'dispatched']

/* ── Signature canvas component ─────────────────────────────────────────────── */
function SignaturePad({ onSigned }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const [signed, setSigned] = useState(false)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    setSigned(true)
    onSigned && onSigned(true)
  }

  const endDraw = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
    onSigned && onSigned(false)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="signature-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        aria-label="Signature pad — draw your signature here"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {signed ? '✓ Signature captured' : 'Draw your signature above'}
        </span>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
          onClick={clear}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

/* ── Photo upload zone ──────────────────────────────────────────────────────── */
function PhotoUpload({ photos, onChange }) {
  const inputRef  = useRef(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!valid.length) return
    const readers = valid.map(f => new Promise(res => {
      const reader = new FileReader()
      reader.onload = () => res({ name: f.name, src: reader.result })
      reader.readAsDataURL(f)
    }))
    Promise.all(readers).then(results => {
      onChange([...photos, ...results].slice(0, 4))
    })
  }

  return (
    <div>
      <div
        className={`upload-zone ${drag ? 'upload-zone--active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="upload-zone-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {drag ? 'Drop photos here' : 'Click or drag to upload photos'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Supports JPG, PNG, HEIC · Max 4 photos
        </div>
      </div>

      {photos.length > 0 && (
        <div className="photo-preview-grid">
          {photos.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p.src} alt={p.name} className="photo-preview-thumb" style={{ width: '100%' }} />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: 6,
                  background: 'rgba(0,0,0,0.7)', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProofOfDelivery() {
  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [photos, setPhotos]       = useState([])
  const [signed, setSigned]       = useState(false)
  const [notes, setNotes]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const location                  = useLocation()
  const navigate                  = useNavigate()
  const { toast }                 = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await driverAPI.getMyJobs()
      const all  = Array.isArray(res.data) ? res.data : []
      const actv = all.filter(o => ACTIVE_STATUSES.includes(o.status?.toLowerCase()))
      setJobs(actv)
      if (!selectedId) {
        const fromState = location.state?.orderId
        const initial   = fromState
          ? actv.find(o => o.order_id === fromState) || actv[0]
          : actv[0]
        if (initial) setSelectedId(initial.order_id)
      }
    } catch {
      toast('Failed to load deliveries', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, location.state])

  useEffect(() => { load() }, [load])

  const selected = jobs.find(j => j.order_id === selectedId)
  const meta     = selected ? getStatusMeta(selected.status) : null

  const canSubmit = signed || photos.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    if (!canSubmit) {
      toast('Please provide a signature or at least one photo', 'warning')
      return
    }
    setSubmitting(true)
    try {
      await driverAPI.markDelivered(selected.order_id)
      toast(`Order #${selected.order_id} confirmed as delivered`, 'success')
      setPhotos([])
      setSigned(false)
      setNotes('')
      setSelectedId(null)
      navigate('/driver/jobs')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to submit proof of delivery', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout role="driver">
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h1 className="admin-page-title" style={{ marginTop: 8 }}>Proof of Delivery</h1>
          <p className="admin-page-subtitle">
            Capture photo evidence and collect recipient signature to confirm delivery
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <span className="spinner" style={{ display: 'inline-block', marginRight: 10 }} />
          Loading deliveries…
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No active deliveries
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            All your deliveries are complete or not yet assigned.
          </div>
          <button className="btn-secondary" onClick={() => navigate('/driver/jobs')}>View All Jobs</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="pod-layout">
            {/* ── Main form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Order selector */}
              {jobs.length > 1 && (
                <div className="admin-card" style={{ margin: 0, padding: '16px 22px' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Select Order
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select
                      className="reassign-select"
                      value={selectedId || ''}
                      onChange={e => setSelectedId(Number(e.target.value))}
                    >
                      {jobs.map(j => (
                        <option key={j.order_id} value={j.order_id}>
                          #{j.order_id} — {j.delivery_address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Photo upload */}
              <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  📸 Delivery Photos
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: 8 }}>
                    (Strongly recommended)
                  </span>
                </div>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>

              {/* Signature pad */}
              <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  ✍️ Recipient Signature
                </div>
                <SignaturePad onSigned={setSigned} />
              </div>

              {/* Notes */}
              <div className="admin-card" style={{ margin: 0, padding: '20px 22px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  📝 Delivery Notes
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes about the delivery (optional)…"
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--bg-surface)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    padding: '12px 14px', color: 'var(--text-primary)',
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    resize: 'vertical', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent"
                  disabled={!canSubmit || submitting || !selected}
                  style={{ minWidth: 160, justifyContent: 'center' }}
                >
                  {submitting ? (
                    <><span className="spinner" /> Submitting…</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Confirm Delivery
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Summary panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selected ? (
                <div className="admin-card" style={{ margin: 0 }}>
                  <div className="admin-card-header">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                      Delivery Summary
                    </span>
                    <span className="status-pill-custom" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ padding: '14px 22px' }}>
                    {[
                      { label: 'Order',    value: `#${selected.order_id}` },
                      { label: 'Address',  value: selected.delivery_address || '—' },
                      { label: 'Client',   value: `Client #${selected.client_id || '—'}` },
                      { label: 'Product',  value: selected.product_id ?? '—' },
                    ].map(r => (
                      <div key={r.label} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                          {r.label}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="admin-card" style={{ margin: 0, padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select an order above</div>
                </div>
              )}

              {/* Checklist */}
              <div className="admin-card" style={{ margin: 0, padding: '16px 22px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Submission Checklist
                </div>
                {[
                  { label: 'Order selected',     done: !!selected },
                  { label: 'Photo uploaded',     done: photos.length > 0, optional: true },
                  { label: 'Signature captured', done: signed,            optional: true },
                  { label: 'Photo or signature', done: canSubmit },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: item.done ? 'rgba(34,197,94,0.15)' : 'var(--bg-surface)',
                      border: `2px solid ${item.done ? '#4ade80' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.done && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.label}
                      {item.optional && !item.done && <em style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'normal' }}> (optional)</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}
    </AppLayout>
  )
}
