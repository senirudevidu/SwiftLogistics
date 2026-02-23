export const STATUS_META = {
  pending:   { bg: 'rgba(234,179,8,0.12)',  color: '#eab308', label: 'Pending'   },
  assigned:  { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', label: 'Assigned'  },
  delivered: { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', label: 'Delivered' },
  failed:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Failed'    },
}

export function getStatusMeta(status) {
  return STATUS_META[status?.toLowerCase()] || {
    bg: 'rgba(255,255,255,0.06)', color: '#8a8f9e', label: status || 'Unknown',
  }
}
