import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <div className="login-bg">
        <div className="grid-overlay" />
        <div className="glow-orb" />
      </div>
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M1 3H15L18 9M1 3V14H3M1 3H0M18 9H20L23 14V18H21M18 9H7M3 14H14M3 14C3 15.66 1.79 17 0.5 17M14 14V18M14 18H6M6 18C6 19.1 5.1 20 4 20C2.9 20 2 19.1 2 18C2 16.9 2.9 16 4 16C5.1 16 6 16.9 6 18ZM19 18C19 19.1 18.1 20 17 20C15.9 20 15 19.1 15 18C15 16.9 15.9 16 17 16C18.1 16 19 16.9 19 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">SwiftTrack</div>
            <div className="brand-tagline">Logistics Management Platform</div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h1>Sign in</h1>
            {/* <p>Enter your credentials to access the platform</p> */}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div className="login-hint">
            <span className="hint-label">Demo credentials</span>
            <div className="hint-row">
              <span className="hint-role">Admin</span>
              <code>admin / admin123</code>
            </div>
          </div>
        </div>

        <div className="login-footer">SwiftLogistics (Pvt) Ltd. &copy; {new Date().getFullYear()}</div>
      </div>
    </div>
  )
}