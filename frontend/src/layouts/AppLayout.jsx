import React from 'react'
import Sidebar from '../components/Sidebar'

/**
 * Shared shell used by NEW pages.
 * Existing pages continue to inline the sidebar for backward-compat.
 */
export default function AppLayout({ role, children }) {
  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">{children}</div>
    </div>
  )
}
