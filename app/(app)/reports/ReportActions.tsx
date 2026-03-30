'use client'
import { useState } from 'react'
import { Download, Loader } from 'lucide-react'
import { api, Class } from '@/lib/api'

interface Props {
  type: 'report-card' | 'class-list' | 'fee-invoice'
  classes: Class[]
  schoolName: string
}

export default function ReportActions({ type, classes, schoolName }: Props) {
  const [selectedClass, setSelectedClass] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [year, setYear] = useState('2024')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleGenerate() {
    if (!selectedClass) { setMsg('Please select a class'); return }
    setLoading(true); setMsg('')
    try {
      if (type === 'class-list') await generateClassList(parseInt(selectedClass))
      else if (type === 'report-card') await generateReportCards(parseInt(selectedClass), term, year)
      else if (type === 'fee-invoice') await generateFeeInvoices(parseInt(selectedClass), term, year)
      setMsg('✅ PDF generated and downloaded!')
    } catch (e: any) {
      setMsg('❌ Error: ' + (e.message || String(e)))
    } finally { setLoading(false) }
  }

  async function generateClassList(classId: number) {
    const students = await api.getStudents({ classId })
    const cls = classes.find(c => c.id === classId)
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    doc.setFillColor(15, 31, 61)
    doc.rect(0, 0, pw, 28, 'F')
    doc.setTextColor(226, 201, 126)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), pw / 2, 11, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text(`CLASS LIST — ${cls?.name} — Academic Year ${year}`, pw / 2, 21, { align: 'center' })
    doc.setTextColor(0)
    doc.setFontSize(9)
    doc.text(`Total Students: ${students.length}`, 14, 36)
    doc.text(`Date: ${new Date().toLocaleDateString('en-GH')}`, pw - 14, 36, { align: 'right' })
    autoTable(doc, {
      startY: 42,
      head: [['#', 'Student ID', 'Full Name', 'Gender', 'Class', 'Parent/Guardian']],
      body: students.map((s, i) => [i + 1, s.studentId, s.name, s.gender, s.class?.name || '', s.parent?.name || '—']),
      theme: 'grid',
      headStyles: { fillColor: [15, 31, 61], textColor: [226, 201, 126], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 247, 240] },
      margin: { left: 14, right: 14 },
    })
    doc.save(`class-list-${cls?.name}-${year}.pdf`)
  }

  async function generateReportCards(classId: number, term: string, year: string) {
    const students = await api.getStudents({ classId })
    if (students.length === 0) throw new Error('No students in this class')
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx]
      if (idx > 0) doc.addPage()
      const data = await api.getReportCard(s.id, term, year)

      doc.setFillColor(15, 31, 61); doc.rect(0, 0, pw, 30, 'F')
      doc.setTextColor(226, 201, 126); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, 12, { align: 'center' })
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
      doc.text('TERMINAL REPORT CARD', pw / 2, 20, { align: 'center' })
      doc.text(`${term} — ${year}`, pw / 2, 27, { align: 'center' })
      doc.setFillColor(201, 168, 76); doc.rect(0, 30, pw, 1.5, 'F')

      doc.setTextColor(0); doc.setFontSize(10)
      let y = 42
      const pairs: [string, string][] = [
        ['Name:', data.student.name], ['ID:', data.student.studentId],
        ['Class:', data.student.class], ['Gender:', data.student.gender],
        ['Position:', data.position ? `${data.position} of ${data.totalStudents}` : 'N/A'],
      ]
      pairs.slice(0, 3).forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold'); doc.text(k, 14, y + i * 7)
        doc.setFont('helvetica', 'normal'); doc.text(String(v), 42, y + i * 7)
      })
      pairs.slice(3).forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold'); doc.text(k, 110, y + i * 7)
        doc.setFont('helvetica', 'normal'); doc.text(String(v), 132, y + i * 7)
      })
      y += 3 * 7 + 6

      if (data.results.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Subject', 'CA (30)', 'Exam (70)', 'Total (100)', 'Grade', 'Remark']],
          body: data.results.map(r => {
            const grade = r.total >= 80 ? 'A' : r.total >= 70 ? 'B' : r.total >= 60 ? 'C' : r.total >= 50 ? 'D' : 'F'
            const remark = r.total >= 80 ? 'Excellent' : r.total >= 70 ? 'Very Good' : r.total >= 60 ? 'Good' : r.total >= 50 ? 'Average' : 'Unsatisfactory'
            return [r.subject, r.ca, r.exam, r.total, grade, remark]
          }),
          theme: 'grid',
          headStyles: { fillColor: [15, 31, 61], textColor: [226, 201, 126], fontSize: 9, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 }, alternateRowStyles: { fillColor: [250, 247, 240] },
          margin: { left: 14, right: 14 },
        })
        const finalY = (doc as any).lastAutoTable?.finalY ?? y + 40
        const avg = data.results.reduce((s, r) => s + r.total, 0) / data.results.length
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 31, 61)
        doc.text(`Overall Average: ${avg.toFixed(1)}%`, 14, finalY + 8)
        doc.text(`Overall Grade: ${avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F'}`, 90, finalY + 8)
      }
      const footY = doc.internal.pageSize.getHeight() - 8
      doc.setFontSize(8); doc.setTextColor(150); doc.setFont('helvetica', 'normal')
      doc.text(`Generated ${new Date().toLocaleDateString('en-GH')} — ${schoolName}`, pw / 2, footY, { align: 'center' })
    }
    doc.save(`report-cards-${students[0]?.class?.name || classId}-${term}-${year}.pdf`)
  }

  async function generateFeeInvoices(classId: number, term: string, year: string) {
    const payments = await api.getPayments({ classId, term })
    if (payments.length === 0) throw new Error('No fee records for this class/term')
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    const cls = classes.find(c => c.id === classId)

    const byStudent: Record<number, typeof payments> = {}
    for (const p of payments) {
      if (!byStudent[p.studentId]) byStudent[p.studentId] = []
      byStudent[p.studentId].push(p)
    }

    let first = true
    for (const [, items] of Object.entries(byStudent)) {
      if (!first) doc.addPage(); first = false
      const student = items[0].student
      doc.setFillColor(22, 163, 74); doc.rect(0, 0, pw, 28, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, 11, { align: 'center' })
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text('FEE INVOICE', pw / 2, 21, { align: 'center' })
      doc.setTextColor(0)
      let y = 38; doc.setFontSize(10)
      doc.setFont('helvetica', 'bold'); doc.text('Student:', 14, y)
      doc.setFont('helvetica', 'normal'); doc.text(student?.name ?? '', 45, y)
      doc.setFont('helvetica', 'bold'); doc.text('Class:', 110, y)
      doc.setFont('helvetica', 'normal'); doc.text(cls?.name || '', 130, y)
      y += 7
      doc.setFont('helvetica', 'bold'); doc.text('Term:', 14, y)
      doc.setFont('helvetica', 'normal'); doc.text(`${term} / ${year}`, 45, y)
      autoTable(doc, {
        startY: y + 10,
        head: [['Fee Item', 'Amount (GHS)', 'Paid (GHS)', 'Balance (GHS)']],
        body: items.map(p => [p.feeType, p.amount.toFixed(2), p.paid.toFixed(2), p.balance.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 }, alternateRowStyles: { fillColor: [240, 255, 244] },
        margin: { left: 14, right: 14 },
      })
      const fy = (doc as any).lastAutoTable?.finalY ?? y + 40
      const totalBal = items.reduce((s, p) => s + p.balance, 0)
      const totalPaid = items.reduce((s, p) => s + p.paid, 0)
      const totalAmt = items.reduce((s, p) => s + p.amount, 0)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0)
      doc.text(`Total Billed: GHS ${totalAmt.toFixed(2)}`, 14, fy + 8)
      doc.setTextColor(22, 163, 74); doc.text(`Total Paid: GHS ${totalPaid.toFixed(2)}`, 80, fy + 8)
      doc.setTextColor(totalBal > 0 ? 185 : 22, totalBal > 0 ? 28 : 163, totalBal > 0 ? 28 : 74)
      doc.text(`Outstanding: GHS ${totalBal.toFixed(2)}`, 148, fy + 8)
    }
    doc.save(`fee-invoices-${cls?.name || classId}-${term}-${year}.pdf`)
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }
  const selectStyle: React.CSSProperties = { padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Class *</label>
          <select style={{ ...selectStyle, width: 200 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.student_count ?? 0} students)</option>)}
          </select>
        </div>
        {type !== 'class-list' && (
          <>
            <div>
              <label style={labelStyle}>Term</label>
              <select style={{ ...selectStyle, width: 120 }} value={term} onChange={e => setTerm(e.target.value)}>
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <select style={{ ...selectStyle, width: 100 }} value={year} onChange={e => setYear(e.target.value)}>
                <option>2023</option><option>2024</option><option>2025</option>
              </select>
            </div>
          </>
        )}
        <button onClick={handleGenerate} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 10px rgba(15,31,61,0.2)' }}>
          {loading ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating PDF…</> : <><Download size={15} /> Generate & Download PDF</>}
        </button>
      </div>
      {msg && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: msg.startsWith('✅') ? 'rgba(22,163,74,0.07)' : '#fef2f2', border: `1px solid ${msg.startsWith('✅') ? 'rgba(22,163,74,0.2)' : '#fecaca'}`, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: msg.startsWith('✅') ? '#15803d' : '#b91c1c' }}>
          {msg}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
