import React, { useState, useEffect } from 'react'
import AppLayout from '../../layouts/AppLayout'
import ProfileField from '../../components/ProfileField'
import { clientAPI, orderAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/* ── Icons ──────────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ── Password field with show/hide toggle ────────────────────────────────── */
function PwField({ label, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          className="form-input"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ paddingRight: 40 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  )
}

const PW_INIT = { current: '', next: '', confirm: '' }
const SECURITY_TIPS = [
  'Use a passphrase with 12+ characters',
  'Avoid reusing passwords across services',
  'Enable two-factor authentication where possible',
  'Never share your credentials with anyone',
]

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ClientProfile() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile]   = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('account')
  const [pw, setPw]             = useState(PW_INIT)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    Promise.all([clientAPI.getProfile(), orderAPI.getMyOrders()])
      .then(([pRes, oRes]) => {
        setProfile(pRes.data)
        setOrders(Array.isArray(oRes.data) ? oRes.data : [])
      })
      .catch(() => toast('Failed to load profile', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const totalOrders   = orders.length
  const activeOrders  = orders.filter(o => !['delivered', 'delivery_failed', 'failed'].includes(o.status)).length
  const doneOrders    = orders.filter(o => o.status === 'delivered').length

  const initials = (profile?.username || user?.username || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handlePwChange = e => setPw(p => ({ ...p, [e.target.name]: e.target.value }))

  const submitPw = async e => {
    e.preventDefault()
    if (!pw.current) return toast('Enter your current password', 'error')
    if (pw.next.length < 8) return toast('New password must be at least 8 characters', 'error')
    if (pw.next !== pw.confirm) return toast('Passwords do not match', 'error')
    setPwLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setPwLoading(false)
    toast('Password changes are managed via the admin portal', 'info')
    setPw(PW_INIT)
  }

  if (loading) {
    return (
      <AppLayout role="client">
        <div style={{ padding: 40, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="spinner" /> Loading profile…
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout role="client">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">My Profile</h1>
          <p className="admin-page-subtitle">Manage your account details and security settings.</p>
        </div>
      </div>

      {/* Profile header card */}
      <div style={{ padding: '0 36px 24px' }}>
        <div className="admin-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
              color: '#fff', flexShrink: 0, letterSpacing: 1
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, margin: 0 }}>
                  {profile?.username || user?.username}
                </h2>
                <span style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Client
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                Client ID: #{profile?.id ?? user?.id ?? '—'}
              </p>
            </div>
            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: totalOrders, color: 'var(--text-primary)' },
                { label: 'Active', value: activeOrders, color: '#eab308' },
                { label: 'Done', value: doneOrders, color: '#4ade80' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: s.color }}>{s.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* Left – tabbed content */}
          <div className="admin-card" style={{ overflow: 'hidden' }}>
            <div className="profile-tabs">
              <button
                className={`profile-tab${activeTab === 'account' ? ' profile-tab--active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <IconUser /> Account
              </button>
              <button
                className={`profile-tab${activeTab === 'security' ? ' profile-tab--active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <IconShield /> Security
              </button>
            </div>

            {activeTab === 'account' && (
              <div className="profile-tab-content">
                <ProfileField label="Username"  value={profile?.username || user?.username || '—'} />
                <ProfileField label="Role"      value="Client" />
                <ProfileField label="Client ID" value={`#${profile?.id ?? user?.id ?? '—'}`} />
                <div style={{
                  marginTop: 20, padding: '12px 16px', borderRadius: 8,
                  background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
                  color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6
                }}>
                  ℹ️ To update your account details, please contact your administrator.
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-tab-content">
                <div className="pw-change-section">
                  <h4 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconKey /> Change Password
                  </h4>
                  <p className="pw-notice">Password changes are processed via the admin portal.</p>
                  <form onSubmit={submitPw} style={{ marginTop: 16 }}>
                    <PwField label="Current Password"  name="current"  value={pw.current}  onChange={handlePwChange} placeholder="Enter current password" />
                    <PwField label="New Password"      name="next"     value={pw.next}     onChange={handlePwChange} placeholder="Min. 8 characters" />
                    <PwField label="Confirm Password"  name="confirm"  value={pw.confirm}  onChange={handlePwChange} placeholder="Repeat new password" />
                    <button type="submit" className="btn-accent" style={{ width: '100%', marginTop: 8 }} disabled={pwLoading}>
                      {pwLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : 'Update Password'}
                    </button>
                  </form>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Security Recommendations
                  </h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SECURITY_TIPS.map(tip => (
                      <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <span style={{ color: '#4ade80', marginTop: 2, flexShrink: 0 }}><IconCheck /></span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right – info + session */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-card" style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Account Info
              </div>
              {[
                { label: 'Status',    value: 'Active',  color: '#4ade80' },
                { label: 'Plan',      value: 'Standard' },
                { label: 'Support',   value: 'Standard' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: r.color || 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div className="admin-card" style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current Session
              </div>
              {[
                { label: 'Auth',    value: 'Authenticated' },
                { label: 'Role',    value: 'Client' },
                { label: 'Method',  value: 'JWT Bearer' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
