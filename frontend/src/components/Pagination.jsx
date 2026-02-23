import React from 'react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)
  const pages = Array.from({ length: right - left + 1 }, (_, i) => left + i)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="pg-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {left > 1 && (
        <>
          <button className="pg-btn" onClick={() => onChange(1)}>1</button>
          {left > 2 && <span className="pg-ellipsis">…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`pg-btn ${p === page ? 'pg-btn--active' : ''}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="pg-ellipsis">…</span>}
          <button className="pg-btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="pg-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  )
}
