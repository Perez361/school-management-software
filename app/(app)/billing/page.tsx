'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Plus, Receipt, AlertCircle, CheckCircle, TrendingUp, Filter } from 'lucide-react'
import { api, Payment, Class, PaymentSummary } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 20

export default function BillingPage() {
  const { can } = useAuth()
  const { version } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('billing')) router.replace('/dashboard') }, [can, router])

  const searchParams = useSearchParams()

  const [classes, setClasses]   = useState<Class[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary]   = useState<PaymentSummary>({ total: 0, collected: 0, outstanding: 0 })
  const [loading, setLoading]   = useState(true)

  const [classFilter,  setClassFilter]  = useState(searchParams.get('classId') ?? '')
  const [termFilter,   setTermFilter]   = useState(searchParams.get('term') ?? '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cls, pays, sum] = await Promise.all([
        api.getClasses(),
        api.getPayments({ classId: classFilter ? parseInt(classFilter) : undefined, term: termFilter || undefined, status: statusFilter || undefined }),
        api.getPaymentSummary({ classId: classFilter ? parseInt(classFilter) : undefined, term: termFilter || undefined }),
      ])
      setClasses(cls); setPayments(pays); setSummary(sum)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [classFilter, termFilter, statusFilter, version])

  useEffect(() => { load() }, [load])

  const collectionRate = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0
  const isFiltered = !!(classFilter || termFilter || statusFilter)

  function applyFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setClassFilter(fd.get('classId') as string ?? '')
    setTermFilter(fd.get('term') as string ?? '')
    setStatusFilter(fd.get('status') as string ?? '')
    setPage(1)
  }

  const totalPages = Math.ceil(payments.length / PAGE_SIZE)
  const paged = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selStyle: React.CSSProperties = { padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: '100%' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Billing & Fees</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>Track fee payments and outstanding balances</span>
            {isFiltered && <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#b45309', background: 'rgba(180,83,9,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>Filtered view</span>}
          </div>
        </div>
        <Link href="/billing/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Record Payment
        </Link>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,16px)' }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 'clamp(8px,2vw,12px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,22px)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Billed</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--navy)' }}>GHS {summary.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{payments.length} transaction{payments.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #16a34a', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,22px)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Collected</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--navy)' }}>GHS {summary.collected.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', marginTop: 4 }}>{payments.filter(p => p.balance === 0).length} fully paid</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #dc2626', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,22px)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Outstanding</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--navy)' }}>GHS {summary.outstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#b91c1c', marginTop: 4 }}>{payments.filter(p => p.balance > 0).length} with balance</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy-light) 100%)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,22px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={14} color="var(--gold)" />
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--on-crimson-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Collection Rate</span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--gold-light)' }}>{collectionRate}%</div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(201,168,76,0.15)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${collectionRate}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gold-pale)' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter Records</span>
          </div>
          <div style={{ padding: 'clamp(12px,2vw,16px) clamp(14px,3vw,22px)' }}>
            <form onSubmit={applyFilter} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Class</label>
                <select name="classId" defaultValue={classFilter} style={selStyle}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Term</label>
                <select name="term" defaultValue={termFilter} style={selStyle}>
                  <option value="">All Terms</option>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Status</label>
                <select name="status" defaultValue={statusFilter} style={selStyle}>
                  <option value="">All Status</option>
                  <option value="paid">Fully Paid</option>
                  <option value="owing">Has Balance</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="submit" style={{ flex: 1, padding: '9px 16px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Apply</button>
                {isFiltered && <button type="button" onClick={() => { setClassFilter(''); setTermFilter(''); setStatusFilter(''); setPage(1) }} style={{ flex: 1, padding: '9px 14px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</button>}
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gold-pale)' }}>
            <Receipt size={14} color="#15803d" />
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Payment Records</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{payments.length} record{payments.length !== 1 ? 's' : ''} total</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'Class', 'Fee Type', 'Term', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      {[160,70,90,60,70,70,70,60].map((w,j) => (
                        <td key={j} style={{ padding: '12px 14px' }}><div className="skeleton skeleton-text" style={{ width: w }} /></td>
                      ))}
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <Receipt size={24} color="var(--gold)" style={{ opacity: 0.4, display: 'block', margin: '0 auto 14px' }} />
                      <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)', marginBottom: 6 }}>{isFiltered ? 'No records match your filters' : 'No payment records yet'}</div>
                      {!isFiltered && <Link href="/billing/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Record First Payment</Link>}
                    </td>
                  </tr>
                ) : paged.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                          {p.student?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{p.student?.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-blue">{p.student?.class.name}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.feeType}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.term}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.amount.toFixed(2)}</span></td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 600, color: '#15803d' }}>{p.paid.toFixed(2)}</span></td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 600, color: p.balance > 0 ? '#b91c1c' : '#15803d' }}>{p.balance.toFixed(2)}</span></td>
                    <td style={{ padding: '11px 14px' }}>
                      {p.balance === 0
                        ? <span className="status-paid"><CheckCircle size={11} /> Paid</span>
                        : <span className="status-owing"><AlertCircle size={11} /> Owing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={payments.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}