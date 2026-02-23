import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { orderAPI } from '../../api'
import { useToast } from '../../context/ToastContext'

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const INITIAL = { delivery_address: '', product_id: '' }

export default function NewOrder() {
  const [form, setForm]       = useState(INITIAL)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const validate = () => {
    const e = {}
    if (!form.delivery_address.trim()) e.delivery_address = 'Delivery address is required.'
    if (!form.product_id) {
      e.product_id = 'Product ID is required.'
    } else if (isNaN(Number(form.product_id)) || Number(form.product_id) < 1) {
      e.product_id = 'Enter a valid numeric Product ID.'
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
    setLoading(true)
    try {
      const res = await orderAPI.submitOrder({
        delivery_address: form.delivery_address.trim(),
        product_id: Number(form.product_id),
      })
      const orderId = res.data?.order_id
      toast(
        orderId ? `Order #${orderId} placed successfully` : 'Order placed successfully',
        'success',
      )
      navigate('/client/orders')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please try again.'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-layout">
      <Sidebar role="client" />
      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <button className="back-btn" onClick={() => navigate(-1)}>
              <IconBack /> Back
            </button>
            <h1 className="admin-page-title" style={{ marginTop: 8 }}>New Order</h1>
            <p className="admin-page-subtitle">Fill in the delivery details to place a new shipment request.</p>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="form-page-grid">
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <IconPackage />
              </div>
              <div>
                <div className="form-card-title">Order Details</div>
                <div className="form-card-subtitle">Provide shipment information below</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
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
                  <span style={{ fontSize: 12, color: 'var(--error)', marginTop: 2 }}>
                    {errors.delivery_address}
                  </span>
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
                  <span style={{ fontSize: 12, color: 'var(--error)', marginTop: 2 }}>
                    {errors.product_id}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent" disabled={loading}>
                  {loading ? <><span className="spinner" /> Placing order…</> : 'Place Order'}
                </button>
              </div>
            </form>
          </div>

          <div className="form-info-panel">
            <div className="info-panel-title">How it works</div>
            <ul className="info-panel-list">
              <li>Submit your order with a valid delivery address and product ID.</li>
              <li>Your order is assigned <strong>Pending</strong> status immediately.</li>
              <li>A driver is assigned automatically by our routing system.</li>
              <li>Track progress in real-time on the <strong>My Orders</strong> page.</li>
              <li>You will be notified once the shipment is delivered.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
