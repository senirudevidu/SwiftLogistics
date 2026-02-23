import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateClient from './pages/admin/CreateClient'
import CreateDriver from './pages/admin/CreateDriver'
import Clients from './pages/admin/Clients'
import Drivers from './pages/admin/Drivers'
import Orders from './pages/admin/Orders'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientOrders from './pages/client/ClientOrders'
import NewOrder from './pages/client/NewOrder'
import ClientProfile from './pages/client/ClientProfile'
import DriverDashboard from './pages/driver/DriverDashboard'
import DriverJobs from './pages/driver/DriverJobs'
import DriverProfile from './pages/driver/DriverProfile'

const Admin = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
)
const Client = ({ children }) => (
  <ProtectedRoute allowedRoles={['client']}>{children}</ProtectedRoute>
)
const Driver = ({ children }) => (
  <ProtectedRoute allowedRoles={['driver']}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/admin/dashboard"     element={<Admin><AdminDashboard /></Admin>} />
            <Route path="/admin/clients"       element={<Admin><Clients /></Admin>} />
            <Route path="/admin/drivers"       element={<Admin><Drivers /></Admin>} />
            <Route path="/admin/orders"        element={<Admin><Orders /></Admin>} />
            <Route path="/admin/create-client" element={<Admin><CreateClient /></Admin>} />
            <Route path="/admin/create-driver" element={<Admin><CreateDriver /></Admin>} />

            {/* Client */}
            <Route path="/client/dashboard" element={<Client><ClientDashboard /></Client>} />
            <Route path="/client/orders"    element={<Client><ClientOrders /></Client>} />
            <Route path="/client/new-order" element={<Client><NewOrder /></Client>} />
            <Route path="/client/profile"   element={<Client><ClientProfile /></Client>} />

            {/* Driver */}
            <Route path="/driver/dashboard" element={<Driver><DriverDashboard /></Driver>} />
            <Route path="/driver/jobs"      element={<Driver><DriverJobs /></Driver>} />
            <Route path="/driver/profile"   element={<Driver><DriverProfile /></Driver>} />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}