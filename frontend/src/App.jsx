import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateClient from './pages/admin/CreateClient'
import CreateDriver from './pages/admin/CreateDriver'
import ClientDashboard from './pages/client/ClientDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-client" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateClient />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-driver" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateDriver />
            </ProtectedRoute>
          } />

          {/* Client */}
          <Route path="/client/dashboard" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          {/* Driver */}
          <Route path="/driver/dashboard" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}