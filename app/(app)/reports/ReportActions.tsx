'use client'
// src/app/reports/ReportActions.tsx
import { useState } from 'react'
import { Download, Loader } from 'lucide-react'
import jsPDF from 'jspdf'

interface Class { id: number; name: string; _count: { students: number } }

interface Props {
  type: 'report-card' | 'class-list' | 'fee-invoice'
  classes: Class[]
  schoolName: string
}

export default function ReportActions({ type, classes, schoolName }: Props) {
  const [selectedClass, setSelectedClass] = useState('')
  const [term, setTerm]   = useState('Term 1')
  const [year, setYear]   = useState('2024')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleGenerate() {
    if (!selectedClass) { setMsg('Please select a class'); return }
    setLoading(true); setMsg('')

    try {
      if (type === 'class-list') {
        await generateClassList(parseInt(selectedClass))
      } else if (type === 'report-card') {
        await generateReportCards(parseInt(selectedClass), term, year)
      } else if (type === 'fee-invoice') {
        await generateFeeInvoices(parseInt(selectedClass), term, year)
      }
      setMsg('✅ PDF generated and downloaded!')
    } catch (e: any) {
      setMsg('❌ Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateClassList(classId: number) {
    const res = await fetch(`/api/students?classId=${classId}`)
    const students = await res.json()
    const cls = classes.find(c => c.id === classId)

    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    doc.setFillColor(67, 56, 202)
    doc.rect(0, 0, pw, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), pw / 2, 11, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`CLASS LIST — ${cls?.name} — Academic Year ${year}`, pw / 2, 21, { align: 'center' })

    doc.setTextColor(0)
    doc.setFontSize(9)
    doc.text(`Total Students: ${students.length}`, 14, 36)
    doc.text(`Date: ${new Date().toLocaleDateString('en-GH')}`, pw - 14, 36, { align: 'right' })

    ;(doc as any).autoTable({
      startY: 42,
      head: [['#', 'Student ID', 'Full Name', 'Gender', 'Class', 'Parent/Guardian']],
      body: students.map((s: any, i: number) => [
        i + 1,
        s.studentId,
        s.name,
        s.gender,
        s.class?.name || '',
        s.parent?.name || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      margin: { left: 14, right: 14 },
    })

    doc.save(`class-list-${cls?.name}-${year}.pdf`)
  }

  async function generateReportCards(classId: number, term: string, year: string) {
    const studentsRes = await fetch(`/api/students?classId=${classId}`)
    const students = await studentsRes.json()

    if (students.length === 0) throw new Error('No students in this class')

    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx]
      if (idx > 0) doc.addPage()

      const reportRes = await fetch(`/api/reports/report-card?studentId=${s.id}&term=${encodeURIComponent(term)}&year=${year}`)
      const data = await reportRes.json()

      // Header
      doc.setFillColor(67, 56, 202)
      doc.rect(0, 0, pw, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, 12, { align: 'center' })
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text('TERMINAL REPORT CARD', pw / 2, 20, { align: 'center' })
      doc.text(`${term} — ${year}`, pw / 2, 27, { align: 'center' })

      // Student info
      doc.setTextColor(0)
      doc.setFontSize(10)
      let y = 40
      const pairs = [
        ['Name:', data.student.name], ['ID:', data.student.studentId],
        ['Class:', data.student.class], ['Gender:', data.student.gender],
        ['Position:', data.position ? `${data.position} of ${data.totalStudents}` : 'N/A'],
      ]
      pairs.forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(k, 14, y)
        doc.setFont('helvetica', 'normal'); doc.text(String(v), 50, y)
        y += 7
      })

      if (data.results.length > 0) {
        ;(doc as any).autoTable({
          startY: y + 3,
          head: [['Subject', 'CA (30)', 'Exam (70)', 'Total (100)', 'Grade']],
          body: data.results.map((r: any) => {
            const grade = r.total >= 80 ? 'A' : r.total >= 70 ? 'B' : r.total >= 60 ? 'C' : r.total >= 50 ? 'D' : 'F'
            return [r.subject, r.ca, r.exam, r.total, grade]
          }),
          theme: 'grid',
          headStyles: { fillColor: [67, 56, 202], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [240, 244, 255] },
          margin: { left: 14, right: 14 },
        })
      } else {
        doc.setFontSize(10); doc.setTextColor(150)
        doc.text('No results recorded for this term.', pw / 2, y + 20, { align: 'center' })
      }

      // Footer
      const footY = doc.internal.pageSize.getHeight() - 8
      doc.setFontSize(8); doc.setTextColor(150)
      doc.text(`Generated ${new Date().toLocaleDateString('en-GH')}`, pw / 2, footY, { align: 'center' })
    }

    doc.save(`report-cards-${students[0]?.class?.name || classId}-${term}-${year}.pdf`)
  }

  async function generateFeeInvoices(classId: number, term: string, year: string) {
    const paymentsRes = await fetch(`/api/payments?classId=${classId}`)
    const payments = await paymentsRes.json()
    const filtered = payments.filter((p: any) => p.term === term && p.year === year)

    if (filtered.length === 0) throw new Error('No fee records for this class/term')

    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    const cls = classes.find(c => c.id === classId)

    // Group by student
    const byStudent: Record<number, any[]> = {}
    for (const p of filtered) {
      if (!byStudent[p.studentId]) byStudent[p.studentId] = []
      byStudent[p.studentId].push(p)
    }

    let first = true
    for (const [sid, items] of Object.entries(byStudent)) {
      if (!first) doc.addPage()
      first = false

      const student = items[0].student
      doc.setFillColor(22, 163, 74)
      doc.rect(0, 0, pw, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(15); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, 11, { align: 'center' })
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text('FEE INVOICE', pw / 2, 21, { align: 'center' })

      doc.setTextColor(0)
      let y = 38
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold'); doc.text('Student:', 14, y)
      doc.setFont('helvetica', 'normal'); doc.text(student.name, 45, y)
      doc.setFont('helvetica', 'bold'); doc.text('Class:', 110, y)
      doc.setFont('helvetica', 'normal'); doc.text(cls?.name || '', 130, y)
      y += 7
      doc.setFont('helvetica', 'bold'); doc.text('Term:', 14, y)
      doc.setFont('helvetica', 'normal'); doc.text(`${term} / ${year}`, 45, y)
      doc.setFont('helvetica', 'bold'); doc.text('ID:', 110, y)
      doc.setFont('helvetica', 'normal'); doc.text(student.studentId, 120, y)

      ;(doc as any).autoTable({
        startY: y + 10,
        head: [['Fee Item', 'Amount (GHS)', 'Paid (GHS)', 'Balance (GHS)']],
        body: items.map((p: any) => [p.feeType, p.amount.toFixed(2), p.paid.toFixed(2), p.balance.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })

      const fy = (doc as any).lastAutoTable.finalY + 8
      const totalBal = items.reduce((s: number, p: any) => s + p.balance, 0)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.setTextColor(totalBal > 0 ? 220 : 22, totalBal > 0 ? 38 : 163, totalBal > 0 ? 38 : 74)
      doc.text(`OUTSTANDING BALANCE: GHS ${totalBal.toFixed(2)}`, 14, fy)
    }

    doc.save(`fee-invoices-${cls?.name || classId}-${term}-${year}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="label text-xs">Class</label>
          <select className="input w-44" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c._count.students} students)</option>
            ))}
          </select>
        </div>
        {type !== 'class-list' && (
          <>
            <div>
              <label className="label text-xs">Term</label>
              <select className="input w-32" value={term} onChange={e => setTerm(e.target.value)}>
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Year</label>
              <select className="input w-28" value={year} onChange={e => setYear(e.target.value)}>
                <option>2024</option>
                <option>2023</option>
                <option>2025</option>
              </select>
            </div>
          </>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? 'Generating PDF...' : 'Generate & Download PDF'}
        </button>
      </div>
      {msg && (
        <p className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      )}
    </div>
  )
}
