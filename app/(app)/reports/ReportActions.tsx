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
  const [year, setYear] = useState('2024/2025')
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
    doc.setFillColor(92, 15, 15)
    doc.rect(0, 0, pw, 28, 'F')
    doc.setFillColor(201, 168, 76); doc.rect(0, 28, pw, 2, 'F')
    doc.setTextColor(201, 168, 76)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), pw / 2, 11, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text(`CLASS LIST — ${cls?.name} — Academic Year ${year}`, pw / 2, 21, { align: 'center' })
    doc.setTextColor(44, 10, 10)
    doc.setFontSize(9)
    doc.text(`Total Students: ${students.length}`, 14, 38)
    doc.text(`Date: ${new Date().toLocaleDateString('en-GH')}`, pw - 14, 38, { align: 'right' })
    autoTable(doc, {
      startY: 44,
      head: [['#', 'Student ID', 'Full Name', 'Gender', 'Class', 'Parent/Guardian']],
      body: students.map((s, i) => [i + 1, s.studentId, s.name, s.gender, s.class?.name || '', s.parent?.name || '—']),
      theme: 'grid',
      headStyles: { fillColor: [92, 15, 15], textColor: [201, 168, 76], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [44, 10, 10] },
      alternateRowStyles: { fillColor: [253, 245, 240] },
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
    const pw  = doc.internal.pageSize.getWidth()   // 210mm
    const ph  = doc.internal.pageSize.getHeight()  // 297mm
    const cardH = ph / 2                           // 148.5mm — half page per card

    const CRIMSON:     [number, number, number] = [92,  15,  15]
    const CRIMSON_MID: [number, number, number] = [139, 26,  26]
    const GOLD:        [number, number, number] = [201, 168, 76]
    const GOLD_PALE:   [number, number, number] = [253, 245, 240]
    const TEXT:        [number, number, number] = [44,  10,  10]
    const GREEN:       [number, number, number] = [22,  163, 74]

    function teacherRemark(avg: number) {
      if (avg >= 80) return 'Excellent performance this term. Keep it up!'
      if (avg >= 70) return 'Very good performance. Continue to put in your best.'
      if (avg >= 60) return 'Good performance. There is room for improvement.'
      if (avg >= 50) return 'Average performance. More effort is needed.'
      return 'Poor performance. Student needs more attention and support.'
    }
    function headRemark(avg: number) {
      if (avg >= 80) return 'Outstanding student. Promoted with distinction.'
      if (avg >= 70) return 'Good student. Continue to work hard next term.'
      if (avg >= 60) return 'Satisfactory. Keep improving each term.'
      if (avg >= 50) return 'Fair performance. Extra effort is required.'
      return 'Needs significant improvement. Please see the class teacher.'
    }

    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx]
      const isSecond = idx % 2 === 1
      const yOff = isSecond ? cardH : 0

      if (idx > 0 && !isSecond) doc.addPage()

      // Dashed cut line between the two cards
      if (isSecond) {
        doc.setDrawColor(180, 150, 150); doc.setLineWidth(0.3)
        doc.setLineDashPattern([3, 2], 0)
        doc.line(4, cardH, pw - 4, cardH)
        doc.setLineDashPattern([], 0)
      }

      const data = await api.getReportCard(s.id, term, year)

      // ── Header band ──────────────────────────────────────
      doc.setFillColor(...CRIMSON); doc.rect(0, yOff, pw, 18, 'F')
      doc.setFillColor(...GOLD);    doc.rect(0, yOff + 18, pw, 1, 'F')
      doc.setTextColor(...GOLD);    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, yOff + 8, { align: 'center' })
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
      doc.text(`TERMINAL REPORT CARD  —  ${term.toUpperCase()}  ·  ${year}`, pw / 2, yOff + 15, { align: 'center' })

      // ── Student info ──────────────────────────────────────
      let y = yOff + 23
      doc.setFillColor(...GOLD_PALE); doc.rect(8, y, pw - 16, 22, 'F')
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(8, y, pw - 16, 22, 'S')

      const infoLeft: [string, string][] = [
        ['Name:', data.student.name],
        ['ID:', data.student.studentId],
        ['Class:', data.student.class],
      ]
      const infoRight: [string, string][] = [
        ['Gender:', data.student.gender],
        ['Position:', data.position ? `${data.position} / ${data.totalStudents}` : 'N/A'],
        ['Year:', year],
      ]
      doc.setFontSize(8)
      infoLeft.forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID); doc.text(k, 11, y + 5 + i * 6)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT); doc.text(String(v), 30, y + 5 + i * 6)
      })
      infoRight.forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID); doc.text(k, 110, y + 5 + i * 6)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT); doc.text(String(v), 128, y + 5 + i * 6)
      })
      y += 25

      // ── Results table ─────────────────────────────────────
      if (data.results.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Subject', 'CA /50', 'Exam /50', 'Total /100', 'Grade', 'Remark']],
          body: data.results.map(r => {
            const grade  = r.total >= 80 ? 'A' : r.total >= 70 ? 'B' : r.total >= 60 ? 'C' : r.total >= 50 ? 'D' : 'F'
            const remark = r.total >= 80 ? 'Excellent' : r.total >= 70 ? 'Very Good' : r.total >= 60 ? 'Good' : r.total >= 50 ? 'Average' : 'Weak'
            const examHalf = Math.round(r.exam / 2 * 10) / 10
            return [r.subject, r.ca.toFixed(1), examHalf.toFixed(1), r.total.toFixed(1), grade, remark]
          }),
          theme: 'grid',
          headStyles: { fillColor: CRIMSON, textColor: GOLD, fontSize: 7.5, fontStyle: 'bold', cellPadding: 2 },
          bodyStyles: { fontSize: 7.5, textColor: TEXT, cellPadding: 2 },
          alternateRowStyles: { fillColor: GOLD_PALE },
          columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 14, halign: 'center' }, 5: { cellWidth: 'auto' } },
          margin: { left: 8, right: 8 },
          tableWidth: pw - 16,
        })
      }

      const tableEndY = (doc as any).lastAutoTable?.finalY ?? y + 30
      const avg = data.results.length > 0
        ? data.results.reduce((sum, r) => sum + r.total, 0) / data.results.length
        : 0
      const overallGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F'

      // ── Summary strip ─────────────────────────────────────
      let cy = tableEndY + 2
      doc.setFillColor(...CRIMSON); doc.rect(8, cy, pw - 16, 8, 'F')
      doc.setTextColor(...GOLD); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text(`Average: ${avg.toFixed(1)}%`, 11, cy + 5.5)
      doc.text(`Grade: ${overallGrade}`, 70, cy + 5.5)
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
      doc.text(`Subjects: ${data.results.length}`, 130, cy + 5.5)
      cy += 10

      // ── Attendance ────────────────────────────────────────
      const att = data.attendance
      if (att && att.totalDays > 0) {
        doc.setFillColor(240, 255, 244); doc.rect(8, cy, pw - 16, 8, 'F')
        doc.setDrawColor(...GREEN); doc.setLineWidth(0.3); doc.rect(8, cy, pw - 16, 8, 'S')
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN)
        doc.text('Attendance:', 11, cy + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        doc.text(`Days: ${att.totalDays}`, 38, cy + 5.5)
        doc.text(`Present: ${att.present}`, 65, cy + 5.5)
        doc.text(`Absent: ${att.absent}`, 95, cy + 5.5)
        doc.text(`Late: ${att.late}`, 122, cy + 5.5)
        const pct = att.totalDays > 0 ? Math.round(att.present / att.totalDays * 100) : 0
        doc.text(`Attendance: ${pct}%`, 145, cy + 5.5)
        cy += 10
      }

      // ── Billing section ───────────────────────────────────
      if (data.billing) {
        const b = data.billing
        doc.setFillColor(255, 248, 230); doc.rect(8, cy, pw - 16, 8, 'F')
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(8, cy, pw - 16, 8, 'S')
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
        doc.text('Term Bill:', 11, cy + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        doc.text(`${b.feeType}`, 35, cy + 5.5)
        doc.text(`Billed: GHS ${b.amount.toFixed(2)}`, 75, cy + 5.5)
        doc.text(`Paid: GHS ${b.paid.toFixed(2)}`, 118, cy + 5.5)
        const balColor: [number, number, number] = b.balance > 0 ? [185, 28, 28] : [22, 163, 74]
        doc.setTextColor(...balColor); doc.setFont('helvetica', 'bold')
        doc.text(`Bal: GHS ${b.balance.toFixed(2)}`, 158, cy + 5.5)
        cy += 10
      }

      // ── Remarks boxes ─────────────────────────────────────
      const remarkBoxH = 14
      const remarkBoxW = (pw - 20) / 2

      // Box 1 — Class Teacher
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3)
      doc.rect(8, cy, remarkBoxW, remarkBoxH, 'S')
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
      doc.text("Class Teacher's Remark:", 11, cy + 4)
      doc.setFont('helvetica', 'italic'); doc.setTextColor(...TEXT)
      doc.text(teacherRemark(avg), 11, cy + 9, { maxWidth: remarkBoxW - 4 })

      // Box 2 — Headteacher
      const box2X = 12 + remarkBoxW
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3)
      doc.rect(box2X, cy, remarkBoxW, remarkBoxH, 'S')
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
      doc.text("Headteacher's Remark:", box2X + 3, cy + 4)
      doc.setFont('helvetica', 'italic'); doc.setTextColor(...TEXT)
      doc.text(headRemark(avg), box2X + 3, cy + 9, { maxWidth: remarkBoxW - 4 })
      cy += remarkBoxH + 2

      // Signature lines
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
      doc.text('Signature: ___________________', 11, cy + 4)
      doc.text('Signature: ___________________', box2X + 3, cy + 4)

      // ── Footer ────────────────────────────────────────────
      const footerY = yOff + cardH - 4
      doc.setFontSize(6.5); doc.setTextColor(160, 100, 100); doc.setFont('helvetica', 'normal')
      doc.text(`Generated ${new Date().toLocaleDateString('en-GH')} — ${schoolName}`, pw / 2, footerY, { align: 'center' })
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
              <input style={{ ...selectStyle, width: 120 }} value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2024/2025" />
            </div>
          </>
        )}
        <button onClick={handleGenerate} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : 'var(--gold-pale)', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 10px rgba(139,26,26,0.2)' }}>
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
