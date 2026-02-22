import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome = {
      admin: '/admin/dashboard',
      client: '/client/dashboard',
      driver: '/driver/dashboard',
    }
    return <Navigate to={roleHome[user.role] || '/login'} replace />
  }

  return children
}