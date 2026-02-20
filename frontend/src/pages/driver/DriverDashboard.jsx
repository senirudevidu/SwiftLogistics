import React from 'react'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'

export default function DriverDashboard() {
  const { user } = useAuth()
  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <div className="page-title">Driver Portal</div>
        <div className="page-subtitle">Your delivery manifest and route for today</div>
        <div className="card" style={{ maxWidth: 500 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Hello <strong style={{ color: 'var(--accent)' }}>{user?.username}</strong>! Manifest and route features coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}