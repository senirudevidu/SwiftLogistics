import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="dot" />
        SwiftTrack
      </div>
      <div className="topbar-right">
        <span className="topbar-user">{user?.username}</span>
        <span className="role-badge">{user?.role}</span>
        <button className="btn-danger" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  )
}