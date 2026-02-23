import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Icons ── */
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const IconJobs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { label: 'Dashboard', path: '/driver/dashboard', icon: <IconDashboard /> },
    ],
  },
  {
    label: 'Deliveries',
    items: [
      { label: 'My Jobs', path: '/driver/jobs', icon: <IconJobs /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', path: '/driver/profile', icon: <IconUser /> },
    ],
  },
]

export default function DriverSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'DR'

  return (
    <aside className="admin-sidebar" aria-label="Driver navigation">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M1 3H15L18 9M1 3V14H3M1 3H0M18 9H20L23 14V18H21M18 9H7M3 14H14M3 14C3 15.66 1.79 17 0.5 17M14 14V18M14 18H6M6 18C6 19.1 5.1 20 4 20C2.9 20 2 19.1 2 18C2 16.9 2.9 16 4 16C5.1 16 6 16.9 6 18ZM19 18C19 19.1 18.1 20 17 20C15.9 20 15 19.1 15 18C15 16.9 15.9 16 17 16C18.1 16 19 16.9 19 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span>SwiftLogistics</span>
      </div>

      {NAV_SECTIONS.map(section => (
        <React.Fragment key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          <nav className="sidebar-nav" aria-label={section.label}>
            {section.items.map(item => (
              <button
                key={item.path}
                className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </React.Fragment>
      ))}

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username}</div>
            <div className="sidebar-user-role">Driver</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <IconLogout />
          Sign out
        </button>
      </div>
    </aside>
  )
}
