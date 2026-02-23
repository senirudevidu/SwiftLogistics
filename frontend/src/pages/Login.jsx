import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)

  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && user) redirectByRole(user.role)
  }, [isAuthenticated, user])

  const redirectByRole = (role) => {
    const from = location.state?.from?.pathname
    if (from) { navigate(from, { replace: true }); return }
    const routes = { admin: '/admin/dashboard', client: '/client/dashboard', driver: '/driver/dashboard' }
    navigate(routes[role] || '/login', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    try {
      const userData = await login(username.trim(), password)
      redirectByRole(userData.role)
    } catch (err) {
      const msg = err.response?.data?.detail
      if (typeof msg === 'string') setError(msg)
      else if (Array.isArray(msg)) setError(msg.map((e) => e.msg).join(', '))
      else setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="left-noise" />
        <div className="left-grid" />

        {/* Floating route dots */}
        <div className="route-map">
          <svg className="route-svg" viewBox="0 0 420 340" fill="none">
            <path
              className="route-path"
              d="M40 280 C 100 240, 160 200, 200 170 S 300 120, 380 60"
              stroke="rgba(249,115,22,0.35)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              fill="none"
            />
            <path
              className="route-path route-path-2"
              d="M60 300 C 130 260, 200 190, 250 160 S 340 110, 400 80"
              stroke="rgba(249,115,22,0.2)"
              strokeWidth="1"
              strokeDasharray="4 6"
              fill="none"
            />
            {[
              [40, 280], [130, 230], [200, 170], [290, 110], [380, 60],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="5" fill="rgba(249,115,22,0.6)" />
                <circle cx={cx} cy={cy} r="10" fill="rgba(249,115,22,0.12)" />
              </g>
            ))}
          </svg>
        </div>

        {/* Brand */}
        <div className="left-brand">
          <div className="brand-icon-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M1 3H15L18 9M1 3V14H3M1 3H0M18 9H20L23 14V18H21M18 9H7M3 14H14M3 14C3 15.66 1.79 17 0.5 17M14 14V18M14 18H6M6 18C6 19.1 5.1 20 4 20C2.9 20 2 19.1 2 18C2 16.9 2.9 16 4 16C5.1 16 6 16.9 6 18ZM19 18C19 19.1 18.1 20 17 20C15.9 20 15 19.1 15 18C15 16.9 15.9 16 17 16C18.1 16 19 16.9 19 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="left-brand-name">SwiftLogistics</span>
        </div>

        <div className="left-content">
          <h2 className="left-headline">Move smarter.<br />Deliver faster.</h2>
          <p className="left-sub">The all-in-one platform for modern logistics teams — real-time tracking, client management, and driver coordination.</p>

          <div className="left-stats">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '50K+', label: 'Deliveries' },
              { value: '< 2s', label: 'Avg. Update' },
            ].map(({ value, label }) => (
              <div className="left-stat" key={label}>
                <div className="left-stat-value">{value}</div>
                <div className="left-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="left-footer">
          Trusted by logistics teams across Sri Lanka
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Mobile brand */}
          <div className="mobile-brand">
            <div className="mobile-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 3H15L18 9M1 3V14H3M1 3H0M18 9H20L23 14V18H21M18 9H7M3 14H14M3 14C3 15.66 1.79 17 0.5 17M14 14V18M14 18H6M6 18C6 19.1 5.1 20 4 20C2.9 20 2 19.1 2 18C2 16.9 2.9 16 4 16C5.1 16 6 16.9 6 18ZM19 18C19 19.1 18.1 20 17 20C15.9 20 15 19.1 15 18C15 16.9 15.9 16 17 16C18.1 16 19 16.9 19 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span>SwiftLogistics</span>
          </div>

          <div className="form-header">
            <p className="form-welcome">Welcome back</p>
            <h1 className="form-title">Sign in to your account</h1>
            <p className="form-desc">Enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Username */}
            <div className={`lf-group ${focused === 'username' ? 'lf-group--focused' : ''} ${username ? 'lf-group--filled' : ''}`}>
              <label htmlFor="username" className="lf-label">Username</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`lf-group ${focused === 'password' ? 'lf-group--focused' : ''} ${password ? 'lf-group--filled' : ''}`}>
              <label htmlFor="password" className="lf-label">Password</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lf-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="lf-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-copyright">
            © {new Date().getFullYear()} SwiftLogistics (Pvt) Ltd. All rights reserved.
          </p>

          {/* Demo credentials — collapsed by default */}
          <details className="demo-hint">
            <summary className="demo-hint-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Demo credentials
            </summary>
            <div className="demo-rows">
              {[
                { role: 'Admin', creds: 'admin / admin123', type: 'admin' },
                { role: 'Client', creds: 'client / client123', type: 'client' },
                { role: 'Driver', creds: 'driver / driver123', type: 'driver' },
              ].map(({ role, creds, type }) => (
                <div className="demo-row" key={role}>
                  <span className={`demo-badge demo-badge--${type}`}>{role}</span>
                  <code>{creds}</code>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}