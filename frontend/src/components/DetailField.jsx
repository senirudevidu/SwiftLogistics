import React from 'react'

export default function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value ?? '—'}</div>
    </div>
  )
}
