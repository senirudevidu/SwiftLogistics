import React from 'react'

export default function ProfileField({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: 'rgba(249,115,22,0.1)',
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 10.5,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
          {value ?? '—'}
        </div>
      </div>
    </div>
  )
}
