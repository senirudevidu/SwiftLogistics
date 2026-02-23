export function getInitials(name) {
  return name?.slice(0, 2).toUpperCase() || '??'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
