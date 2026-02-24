import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HOME = {
  admin: '/admin/dashboard',
  client: '/client/dashboard',
  driver: '/driver/dashboard',
}

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGoHome = () => {
    navigate(user ? (ROLE_HOME[user.role] || '/login') : '/login', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Glow backdrop */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* 404 numeral */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(80px, 18vw, 160px)',
          lineHeight: 1,
          background: 'linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.06) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.04em',
          userSelect: 'none',
          marginBottom: 8,
        }}
      >
        404
      </div>

      {/* Truck icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
          marginBottom: 28,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 10,
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          maxWidth: 380,
          lineHeight: 1.7,
          marginBottom: 36,
        }}
      >
        The route you're looking for has gone off the map. It may have been
        moved, deleted, or never existed in this logistics network.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ fontSize: 14, padding: '10px 22px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Go Back
        </button>
        <button
          onClick={handleGoHome}
          className="btn-accent"
          style={{ fontSize: 14, padding: '10px 22px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go to Dashboard
        </button>
      </div>

      {/* Bottom hint */}
      {user && (
        <p
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Logged in as <strong style={{ color: 'var(--text-secondary)' }}>{user.username}</strong> · {user.role}
        </p>
      )}
    </div>
  )
}
