import React, { useEffect } from 'react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="confirm-modal-title" className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onCancel} aria-label="Close dialog" disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="modal-body">{message}</p>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-accent'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Processing…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
