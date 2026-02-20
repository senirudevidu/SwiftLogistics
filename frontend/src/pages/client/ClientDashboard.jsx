import React from 'react'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'

export default function ClientDashboard() {
  const { user } = useAuth()
  return (
    <div className="dashboard-layout">
      <TopBar />
      <main className="dashboard-body">
        <div className="page-title">Welcome, {user?.username}</div>
        <div className="page-subtitle">Manage your deliveries and track orders</div>
        <div className="card" style={{ maxWidth: 500 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            You are logged in as a <strong style={{ color: 'var(--accent)' }}>client</strong>. Order submission and tracking coming next.
          </p>
        </div>
      </main>
    </div>
  )
}