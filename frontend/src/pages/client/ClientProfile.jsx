import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import ProfileField from '../../components/ProfileField'
import { clientAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

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
const IconId = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 10h2M16 14h2M7 10h.01" />
    <circle cx="7" cy="10" r="2" />
    <path d="M4 18c0-2 1.5-3 3-3h1.5" />
  </svg>
)



export default function ClientProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await clientAPI.getProfile()
        setProfile(res.data)
      } catch {
        toast('Could not load profile', 'error')
        setProfile({ username: user?.username, role: user?.role })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const initials = (profile?.username ?? user?.username ?? '??')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="admin-layout">
      <Sidebar role="client" />
      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Profile</h1>
            <p className="admin-page-subtitle">Your account information.</p>
          </div>
        </div>

        <div style={{ padding: '0 36px 36px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22, alignItems: 'start' }}>

          {/* ── Profile card ── */}
          <div className="admin-card" style={{ margin: 0 }}>
            {/* Avatar header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '24px 24px 22px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(249,115,22,0.15)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 22,
                border: '2px solid rgba(249,115,22,0.25)',
                flexShrink: 0,
              }}>
                {loading ? '…' : initials}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                  {loading ? 'Loading…' : (profile?.username ?? user?.username)}
                </div>
                <div style={{
                  marginTop: 5,
                  display: 'inline-block',
                  fontSize: 11,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(249,115,22,0.3)',
                }}>
                  Client
                </div>
              </div>
            </div>

            {/* Fields */}
            {loading ? (
              <div className="table-empty">
                <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                Loading profile…
              </div>
            ) : (
              <>
                <ProfileField
                  label="Username"
                  value={profile?.username ?? user?.username}
                  icon={<IconUser />}
                />
                <ProfileField
                  label="Role"
                  value="Client"
                  icon={<IconShield />}
                />
                <ProfileField
                  label="Client ID"
                  value={profile?.client_id != null ? `#${profile.client_id}` : null}
                  icon={<IconId />}
                />
                <div style={{ padding: '0 0 0', borderBottom: 'none' }} />
              </>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="form-info-panel">
            <div className="info-panel-title">Account Details</div>
            <ul className="info-panel-list">
              <li>Your username is used to sign in and cannot be changed here.</li>
              <li>The <strong>Client ID</strong> is your unique identifier linked to your orders.</li>
              <li>Your role determines which features and data you can access.</li>
              <li>Contact an administrator if you need to update account information.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
