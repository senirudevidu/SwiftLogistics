import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import ProfileField from '../../components/ProfileField'
import { driverAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/* ── Icons ── */
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
const IconTruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)



function StatItem({ label, value, color }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '16px',
      flex: 1,
      borderRight: '1px solid var(--border)',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 800,
        color: color || 'var(--text-primary)',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10.5,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>
    </div>
  )
}

export default function DriverProfile() {
  const [profile, setProfile]   = useState(null)
  const [jobStats, setJobStats] = useState({ total: 0, delivered: 0, assigned: 0, failed: 0 })
  const [loading, setLoading]   = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await driverAPI.getProfile()
        setProfile(res.data)
      } catch {
        setProfile({ username: user?.username, role: user?.role })
      }

      try {
        const jobsRes = await driverAPI.getMyJobs()
        const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : []
        setJobStats({
          total:     jobs.length,
          delivered: jobs.filter(j => j.status?.toLowerCase() === 'delivered').length,
          assigned:  jobs.filter(j => j.status?.toLowerCase() === 'assigned').length,
          failed:    jobs.filter(j => j.status?.toLowerCase() === 'failed').length,
        })
      } catch {
        // non-critical — degrade gracefully
      }

      setLoading(false)
    }
    load()
  }, [])

  const initials = (profile?.username ?? user?.username ?? '??')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="admin-layout">
      <Sidebar role="driver" />
      <div className="admin-main">
        {/* ── Topbar ── */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Profile</h1>
            <p className="admin-page-subtitle">Your driver account information.</p>
          </div>
        </div>

        <div style={{ padding: '0 36px 36px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22, alignItems: 'start' }}>

          {/* ── Profile card ── */}
          <div>
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
                    background: 'rgba(99,102,241,0.12)',
                    color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}>
                    Driver
                  </div>
                </div>
              </div>

              {/* Job stats strip */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <StatItem label="Total Jobs"   value={loading ? '—' : jobStats.total}     />
                <StatItem label="Delivered"    value={loading ? '—' : jobStats.delivered}  color="#4ade80" />
                <StatItem label="Assigned"     value={loading ? '—' : jobStats.assigned}   color="#818cf8" />
                <div style={{ flex: 1 }}>
                  <StatItem label="Failed"     value={loading ? '—' : jobStats.failed}     color="#f87171" />
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
                    value="Driver"
                    icon={<IconShield />}
                  />
                  <ProfileField
                    label="Account Status"
                    value="Active"
                    icon={<IconActivity />}
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Info panel ── */}
          <div className="form-info-panel">
            <div className="info-panel-title">Account Details</div>
            <ul className="info-panel-list">
              <li>Your username is used to sign in to the SwiftLogistics platform.</li>
              <li>Job assignments are made by the dispatch system and will appear in <strong>My Jobs</strong>.</li>
              <li>Update your delivery status promptly to keep the system accurate.</li>
              <li>Contact an administrator to update vehicle information or account details.</li>
              <li>Your performance history is tracked across all completed deliveries.</li>
            </ul>

            {/* Status key */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 10,
              }}>
                Status Guide
              </div>
              {[
                { color: '#eab308', label: 'Pending',   desc: 'Awaiting assignment'    },
                { color: '#818cf8', label: 'Assigned',  desc: 'Ready for pickup'       },
                { color: '#4ade80', label: 'Delivered', desc: 'Successfully delivered' },
                { color: '#f87171', label: 'Failed',    desc: 'Delivery unsuccessful'  },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>— {s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
