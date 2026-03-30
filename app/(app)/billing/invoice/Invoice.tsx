'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Receipt } from 'lucide-react'
import { api, Payment } from '@/lib/api'

export default function InvoicePage() {
  const searchParams = useSearchParams()
  const paymentId = parseInt(searchParams.get('id') ?? '')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPayments().then(pays => {
      const found = pays.find(p => p.id === paymentId) ?? null
      setPayment(found)
    }).finally(() => setLoading(false))
  }, [paymentId])

  async function handleDownload() {
    if (!payment) return
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    doc.setFillColor(22, 163, 74)
    doc.rect(0, 0, pw, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('FEE INVOICE', pw / 2, 11, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Receipt #${payment.id}`, pw / 2, 21, { align: 'center' })

    doc.setTextColor(0)
    let y = 38
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Student:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(payment.student?.name ?? '', 45, y)
    doc.setFont('helvetica', 'bold')
    doc.text('Class:', 110, y)
    doc.setFont('helvetica', 'normal')
    doc.text(payment.student?.class?.name ?? '', 130, y)
    y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('Term:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`${payment.term} / ${payment.year}`, 45, y)

    autoTable(doc, {
      startY: y + 12,
      head: [['Fee Item', 'Amount (GHS)', 'Paid (GHS)', 'Balance (GHS)']],
      body: [[
        payment.feeType,
        payment.amount.toFixed(2),
        payment.paid.toFixed(2),
        payment.balance.toFixed(2),
      ]],
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })

    doc.save(`invoice-${payment.id}.pdf`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!payment) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: 40 }}>
        <div style={{ fontFamily: 'system-ui', color: 'var(--text-muted)' }}>Payment not found.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/billing" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Billing</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Invoice #{payment.id}</h1>
          </div>
        </div>
        <button onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 10px rgba(139,26,26,0.2)' }}>
          <Download size={15} /> Download PDF
        </button>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 680 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={16} color="#15803d" />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Fee Invoice</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                ['Student', payment.student?.name ?? '—'],
                ['Class', payment.student?.class?.name ?? '—'],
                ['Fee Type', payment.feeType],
                ['Term', `${payment.term} / ${payment.year}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 14, color: 'var(--navy)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--navy)', padding: '10px 16px' }}>
                {['Total Billed (GHS)', 'Paid (GHS)', 'Balance (GHS)'].map(h => (
                  <div key={h} style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'rgba(201,168,76,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '14px 16px', background: 'var(--surface-2)' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{payment.amount.toFixed(2)}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#15803d' }}>{payment.paid.toFixed(2)}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: payment.balance > 0 ? '#b91c1c' : '#15803d' }}>{payment.balance.toFixed(2)}</div>
              </div>
            </div>
            {payment.balance === 0 && (
              <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                ✅ Fully Paid — No outstanding balance
              </div>
            )}
            {payment.balance > 0 && (
              <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.2)', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: '#b91c1c' }}>
                ⚠️ Outstanding balance of GHS {payment.balance.toFixed(2)} remaining
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
