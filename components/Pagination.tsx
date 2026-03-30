'use client'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPage: (p: number) => void
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalItems)

  // Build page numbers: always show first, last, current ±1, with ellipsis
  const pages: (number | '...')[] = []
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }
  add(1)
  if (page - 2 > 2) pages.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
  if (page + 2 < totalPages - 1) pages.push('...')
  if (totalPages > 1) add(totalPages)

  const btn = (active: boolean, disabled: boolean, onClick: () => void, children: React.ReactNode, key?: string | number) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 34, height: 34, padding: '0 10px',
        borderRadius: 8, border: active ? 'none' : '1px solid var(--border)',
        background: active ? 'var(--navy)' : disabled ? 'transparent' : 'var(--surface)',
        color: active ? 'var(--gold-pale)' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        fontFamily: 'system-ui', fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.14s',
      }}
    >
      {children}
    </button>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px', borderTop: '1px solid var(--border-soft)',
      flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{from}–{to}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong>
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn(false, page === 1, () => onPage(page - 1), '←')}
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
            : btn(p === page, false, () => onPage(p as number), p, p)
        )}
        {btn(false, page === totalPages, () => onPage(page + 1), '→')}
      </div>
    </div>
  )
}
