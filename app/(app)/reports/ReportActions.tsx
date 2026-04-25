'use client'
import { useState, useEffect } from 'react'
import { Download, Loader } from 'lucide-react'
import { api, Class, SchoolSettings, Student } from '@/lib/api'
import { toTitleCase } from '@/lib/utils'

interface Props {
  type: 'report-card' | 'class-list' | 'fee-invoice' | 'transcript'
  classes: Class[]
  schoolName: string
}

export default function ReportActions({ type, classes, schoolName }: Props) {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [term, setTerm] = useState('Term 1')
  const [year, setYear] = useState('')
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)

  useEffect(() => {
    api.getSettings().then(s => {
      if (s) {
        setSchoolSettings(s)
        setTerm(s.currentTerm)
        setYear(s.currentYear)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (type === 'transcript' && selectedClass) {
      api.getStudents({ classId: parseInt(selectedClass) }).then(setStudents).catch(() => {})
      setSelectedStudent('')
    }
  }, [type, selectedClass])

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleGenerate() {
    if (!selectedClass) { setMsg('Please select a class'); return }
    if (type === 'transcript' && !selectedStudent) { setMsg('Please select a student'); return }
    setLoading(true); setMsg('')
    try {
      if (type === 'class-list') await generateClassList(parseInt(selectedClass))
      else if (type === 'report-card') await generateReportCards(parseInt(selectedClass), term, year, schoolSettings)
      else if (type === 'fee-invoice') await generateFeeInvoices(parseInt(selectedClass), term, year)
      else if (type === 'transcript') await generateTranscript(parseInt(selectedStudent))
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
      body: students.map((s, i) => [i + 1, s.studentId, toTitleCase(s.name), s.gender, s.class?.name || '', s.parent ? toTitleCase(s.parent.name) : '—']),
      theme: 'grid',
      headStyles: { fillColor: [92, 15, 15], textColor: [201, 168, 76], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [44, 10, 10] },
      alternateRowStyles: { fillColor: [253, 245, 240] },
      margin: { left: 14, right: 14 },
    })
    doc.save(`class-list-${cls?.name}-${year}.pdf`)
  }

  async function generateReportCards(classId: number, term: string, year: string, settings: SchoolSettings | null) {
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

    function pickRemark(pool: string[], studentId: number) {
      return pool[studentId % pool.length]
    }
    function teacherRemark(avg: number, studentId: number) {
      if (avg >= 80) return pickRemark([
        'Excellent performance this term. Keep it up!',
        'Outstanding work this term. You are a model student.',
        'Brilliant effort! Your dedication is truly commendable.',
        'Superb results! Continue to set the standard for others.',
        'Exceptional performance. We are very proud of your achievement.',
      ], studentId)
      if (avg >= 70) return pickRemark([
        'Very good performance. Continue to put in your best.',
        'Impressive work this term. A little more effort and you will be at the top.',
        'You have done well this term. Keep pushing yourself higher.',
        'Very commendable performance. Stay focused and keep it up.',
        'Good job this term. Your hard work is clearly paying off.',
      ], studentId)
      if (avg >= 60) return pickRemark([
        'Good performance. There is room for improvement.',
        'A decent term overall. With more effort you can achieve much more.',
        'You are on the right track. Keep working hard next term.',
        'Satisfactory performance. Aim higher and you will get there.',
        'Good effort this term. Focus more and results will improve.',
      ], studentId)
      if (avg >= 50) return pickRemark([
        'Average performance. More effort is needed next term.',
        'You can do better. Please spend more time on your studies.',
        'Fair performance. Set higher targets and work towards them.',
        'More commitment is needed. Do not give up — improvement is possible.',
        'You have potential. Channel your energy into your studies.',
      ], studentId)
      return pickRemark([
        'Poor performance. Student needs more attention and support.',
        'Below expectation. Serious effort is required next term.',
        'You need to work harder. Please seek help from your teacher.',
        'Results are below standard. Extra lessons are strongly advised.',
        'Very poor performance. Let us work together to improve next term.',
      ], studentId)
    }
    function headRemark(avg: number, studentId: number, isFinalTerm: boolean) {
      if (avg >= 80) return pickRemark(isFinalTerm ? [
        'Outstanding student. Promoted with distinction.',
        'Excellent results. Promoted to the next class with honours.',
        'Remarkable achievement. Moves on with the highest commendation.',
        'A distinguished performance. Promoted with pride.',
        'Top of the class. Well deserved promotion.',
      ] : [
        'Outstanding performance. Keep up the excellent work.',
        'A brilliant student. Maintain this standard throughout the year.',
        'Excellent results. We expect even greater things from you.',
        'Superb effort this term. Continue to lead by example.',
        'Remarkable performance. The school is proud of you.',
      ], studentId)
      if (avg >= 70) return pickRemark(isFinalTerm ? [
        'Good student. Promoted to the next class.',
        'Very good performance. Continue to work hard.',
        'Commendable results. Moves on to the next level.',
        'Well done. Promoted on merit.',
        'Good effort. Continue improving next year.',
      ] : [
        'Very good performance. Keep striving for excellence.',
        'Good student. Maintain this effort through the year.',
        'Commendable work. Push a little harder next term.',
        'Well done this term. Aim for the top.',
        'Good performance. Keep the momentum going.',
      ], studentId)
      if (avg >= 60) return pickRemark(isFinalTerm ? [
        'Satisfactory performance. Promoted to the next class.',
        'Acceptable results. Continue to improve next year.',
        'Passes on to the next class. More effort is expected.',
        'Moves on. Please work harder in the new academic year.',
        'Satisfactory. Promoted — aim higher next year.',
      ] : [
        'Satisfactory performance. There is room to do better.',
        'Keep improving. You are capable of more.',
        'Decent effort. Focus more in the coming term.',
        'Acceptable results. Raise your targets next term.',
        'Satisfactory. Stay consistent and aim higher.',
      ], studentId)
      if (avg >= 50) return pickRemark(isFinalTerm ? [
        'Borderline performance. Promoted — significant improvement expected.',
        'Marginal pass. Must work much harder next year.',
        'Just qualifies for promotion. Do not rest on this.',
        'Promoted on condition. Greater commitment is required.',
        'Passes to the next class. Please take studies more seriously.',
      ] : [
        'Fair performance. Extra effort is required next term.',
        'Below potential. Work harder in the coming term.',
        'Marginal performance. Please commit more to your studies.',
        'More seriousness is needed. You can do much better.',
        'Fair result. Do not settle — push for more next term.',
      ], studentId)
      return pickRemark(isFinalTerm ? [
        'Below standard. Does not qualify for promotion at this time.',
        'Poor performance. Repeating the class is recommended.',
        'Needs significant improvement before advancing.',
        'Results are unsatisfactory. Please see the class teacher.',
        'Performance is below the required standard for promotion.',
      ] : [
        'Needs significant improvement. Please see the class teacher.',
        'Very poor results. Urgent intervention is required.',
        'Below standard. Student must work much harder.',
        'Poor performance. Extra support is strongly advised.',
        'Unsatisfactory results. Serious action must be taken next term.',
      ], studentId)
    }

    // ── A5 layout constants (each card = half of A4 = 210mm × 148.5mm) ──────
    // Every measurement is chosen so the worst case (14 subjects + all optional
    // rows) still fits within cardH without overflow.
    const MARGIN   = 7          // left/right margin
    const HDR_H    = 12         // header band height
    const GOLD_LN  = 0.5        // gold accent line under header
    const INFO_Y   = HDR_H + GOLD_LN + 2   // 14.5 — top of student info box
    const INFO_H   = 15         // student info box height
    const TBL_Y    = INFO_Y + INFO_H + 2    // 31.5 — table start (relative to yOff)
    const SUM_H    = 7          // summary strip height
    const SUM_GAP  = 1          // gap before summary
    const ROW_H    = 6.5        // attendance / billing / next-term row height
    const ROW_GAP  = 1          // gap between rows
    const REM_H    = 11         // remarks box height
    const SIG_H    = 5          // signature row height
    const FOOT_Y   = cardH - 3  // footer baseline from top of card

    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx]
      const isSecond = idx % 2 === 1
      const yOff = isSecond ? cardH : 0

      if (idx > 0 && !isSecond) doc.addPage()

      // Dashed cut line between the two cards on the same page
      if (isSecond) {
        doc.setDrawColor(180, 150, 150); doc.setLineWidth(0.3)
        doc.setLineDashPattern([3, 2], 0)
        doc.line(4, cardH, pw - 4, cardH)
        doc.setLineDashPattern([], 0)
      }

      const data = await api.getReportCard(s.id, term, year)

      // ── Header band ──────────────────────────────────────
      doc.setFillColor(...CRIMSON)
      doc.rect(0, yOff, pw, HDR_H, 'F')
      doc.setFillColor(...GOLD)
      doc.rect(0, yOff + HDR_H, pw, GOLD_LN, 'F')
      doc.setTextColor(...GOLD); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.text(schoolName.toUpperCase(), pw / 2, yOff + 7, { align: 'center' })
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
      doc.text(`TERMINAL REPORT CARD  —  ${term.toUpperCase()}  ·  ${year}`, pw / 2, yOff + 11.5, { align: 'center' })

      // ── Student info box ──────────────────────────────────
      const infoTop = yOff + INFO_Y
      doc.setFillColor(...GOLD_PALE)
      doc.rect(MARGIN, infoTop, pw - MARGIN * 2, INFO_H, 'F')
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.2)
      doc.rect(MARGIN, infoTop, pw - MARGIN * 2, INFO_H, 'S')

      const infoLeft: [string, string][] = [
        ['Name:',  toTitleCase(data.student.name)],
        ['ID:',    data.student.studentId],
        ['Class:', data.student.class],
      ]
      const infoRight: [string, string][] = [
        ['Gender:',   data.student.gender],
        ['Position:', data.position ? `${data.position} / ${data.totalStudents}` : 'N/A'],
        ['Year:',     year],
      ]
      doc.setFontSize(7)
      infoLeft.forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold');   doc.setTextColor(...CRIMSON_MID); doc.text(k, MARGIN + 3, infoTop + 4 + i * 4.2)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT);        doc.text(String(v), MARGIN + 20, infoTop + 4 + i * 4.2)
      })
      infoRight.forEach(([k, v], i) => {
        doc.setFont('helvetica', 'bold');   doc.setTextColor(...CRIMSON_MID); doc.text(k, 108, infoTop + 4 + i * 4.2)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT);        doc.text(String(v), 124, infoTop + 4 + i * 4.2)
      })

      // ── Results table ─────────────────────────────────────
      const tblStart = yOff + TBL_Y
      if (data.results.length > 0) {
        autoTable(doc, {
          startY: tblStart,
          head: [['Subject', 'CA /50', 'Exam /50', 'Total /100', 'Grd', 'Remark']],
          body: data.results.map(r => {
            const grade  = r.total >= 80 ? 'A' : r.total >= 70 ? 'B' : r.total >= 60 ? 'C' : r.total >= 50 ? 'D' : 'F'
            const remark = r.total >= 80 ? 'Excellent' : r.total >= 70 ? 'Very Good' : r.total >= 60 ? 'Good' : r.total >= 50 ? 'Average' : 'Weak'
            return [r.subject, r.ca.toFixed(1), (r.exam / 2).toFixed(1), r.total.toFixed(1), grade, remark]
          }),
          theme: 'grid',
          headStyles: { fillColor: CRIMSON, textColor: GOLD, fontSize: 7, fontStyle: 'bold', cellPadding: 1.2 },
          bodyStyles: { fontSize: 7, textColor: TEXT, cellPadding: 1.2 },
          alternateRowStyles: { fillColor: GOLD_PALE },
          columnStyles: {
            0: { cellWidth: 52 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 10, halign: 'center' },
            5: { cellWidth: 'auto' },
          },
          margin: { left: MARGIN, right: MARGIN },
          tableWidth: pw - MARGIN * 2,
        })
      }

      const tableEndY = (doc as any).lastAutoTable?.finalY ?? tblStart + 20
      const avg = data.results.length > 0
        ? data.results.reduce((sum, r) => sum + r.total, 0) / data.results.length : 0
      const overallGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F'

      // ── Summary strip ─────────────────────────────────────
      let cy = tableEndY + SUM_GAP
      doc.setFillColor(...CRIMSON)
      doc.rect(MARGIN, cy, pw - MARGIN * 2, SUM_H, 'F')
      doc.setTextColor(...GOLD); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.text(`Avg: ${avg.toFixed(1)}%`, MARGIN + 3, cy + 4.8)
      doc.text(`Grade: ${overallGrade}`, 65, cy + 4.8)
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
      doc.text(`Subjects: ${data.results.length}`, 120, cy + 4.8)
      cy += SUM_H + ROW_GAP

      // ── Attendance ────────────────────────────────────────
      const att = data.attendance
      if (att && att.totalDays > 0) {
        doc.setFillColor(240, 255, 244)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'F')
        doc.setDrawColor(...GREEN); doc.setLineWidth(0.2)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'S')
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN)
        doc.text('Attendance:', MARGIN + 3, cy + 4.4)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        const pct = Math.round(att.present / att.totalDays * 100)
        doc.text(`Days: ${att.totalDays}  Present: ${att.present}  Absent: ${att.absent}  Late: ${att.late}  Rate: ${pct}%`, 38, cy + 4.4)
        cy += ROW_H + ROW_GAP
      }

      // ── Billing ───────────────────────────────────────────
      if (data.billing) {
        const b = data.billing
        doc.setFillColor(255, 248, 230)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'F')
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.2)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'S')
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
        doc.text('Term Bill:', MARGIN + 3, cy + 4.4)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        doc.text(`${b.feeType}  Billed: GHS ${b.amount.toFixed(2)}  Paid: GHS ${b.paid.toFixed(2)}`, 33, cy + 4.4)
        const balColor: [number, number, number] = b.balance > 0 ? [185, 28, 28] : [22, 163, 74]
        doc.setTextColor(...balColor); doc.setFont('helvetica', 'bold')
        doc.text(`Bal: GHS ${b.balance.toFixed(2)}`, 158, cy + 4.4)
        cy += ROW_H + ROW_GAP
      }

      // ── Next term fees ────────────────────────────────────
      if (settings?.nextTermFee && settings.nextTermFee > 0) {
        doc.setFillColor(240, 248, 255)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'F')
        doc.setDrawColor(100, 140, 200); doc.setLineWidth(0.2)
        doc.rect(MARGIN, cy, pw - MARGIN * 2, ROW_H, 'S')
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 60, 130)
        doc.text(`${settings.nextTermName ?? 'Next Term'} Fees:`, MARGIN + 3, cy + 4.4)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        doc.text(`GHS ${settings.nextTermFee.toFixed(2)} — Please pay at the start of term.`, 48, cy + 4.4)
        cy += ROW_H + ROW_GAP
      }

      // ── Remarks boxes ─────────────────────────────────────
      const remarkBoxW = (pw - MARGIN * 2 - 2) / 2
      const box2X = MARGIN + remarkBoxW + 2

      doc.setDrawColor(...GOLD); doc.setLineWidth(0.2)
      doc.rect(MARGIN, cy, remarkBoxW, REM_H, 'S')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
      doc.text("Class Teacher's Remark:", MARGIN + 2, cy + 3.5)
      doc.setFont('helvetica', 'italic'); doc.setTextColor(...TEXT)
      doc.text(teacherRemark(avg, s.id), MARGIN + 2, cy + 7.5, { maxWidth: remarkBoxW - 4 })

      doc.setDrawColor(...GOLD); doc.setLineWidth(0.2)
      doc.rect(box2X, cy, remarkBoxW, REM_H, 'S')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID)
      doc.text("Headteacher's Remark:", box2X + 2, cy + 3.5)
      doc.setFont('helvetica', 'italic'); doc.setTextColor(...TEXT)
      doc.text(headRemark(avg, s.id, term === 'Term 3'), box2X + 2, cy + 7.5, { maxWidth: remarkBoxW - 4 })
      cy += REM_H + 1

      // ── Signature lines ───────────────────────────────────
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
      doc.text('Signature: ____________________', MARGIN + 2, cy + SIG_H - 1)
      doc.text('Signature: ____________________', box2X + 2, cy + SIG_H - 1)

      // ── Footer ────────────────────────────────────────────
      doc.setFontSize(6); doc.setTextColor(160, 100, 100); doc.setFont('helvetica', 'normal')
      doc.text(`Generated ${new Date().toLocaleDateString('en-GH')} — ${schoolName}`, pw / 2, yOff + FOOT_Y, { align: 'center' })
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
      doc.setFont('helvetica', 'normal'); doc.text(student ? toTitleCase(student.name) : '', 45, y)
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

  async function generateTranscript(studentId: number) {
    const allResults = await api.getResults({ studentId })
    if (allResults.length === 0) throw new Error('No results found for this student')
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    const CRIMSON:     [number, number, number] = [92,  15,  15]
    const CRIMSON_MID: [number, number, number] = [139, 26,  26]
    const GOLD:        [number, number, number] = [201, 168, 76]
    const GOLD_PALE:   [number, number, number] = [253, 245, 240]
    const TEXT:        [number, number, number] = [44,  10,  10]

    const student = allResults[0].student!
    const M = 14

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(...CRIMSON)
    doc.rect(0, 0, pw, 30, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, 30, pw, 1, 'F')
    doc.setTextColor(...GOLD); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), pw / 2, 12, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
    doc.text('OFFICIAL ACADEMIC TRANSCRIPT', pw / 2, 21, { align: 'center' })
    doc.setFontSize(7.5)
    doc.text(`Issued: ${new Date().toLocaleDateString('en-GH')}`, pw / 2, 28, { align: 'center' })

    // ── Student info box ─────────────────────────────────────
    doc.setFillColor(...GOLD_PALE)
    doc.rect(M, 36, pw - M * 2, 22, 'F')
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3)
    doc.rect(M, 36, pw - M * 2, 22, 'S')
    doc.setFontSize(8)
    const infoL: [string, string][] = [
      ['Full Name:', toTitleCase(student.name)],
      ['Student ID:', student.studentId],
      ['Class:', student.class?.name ?? ''],
    ]
    const infoR: [string, string][] = [
      ['Gender:', allResults[0].student?.name ? (students.find(s => s.id === studentId)?.gender ?? '') : ''],
      ['Date of Birth:', students.find(s => s.id === studentId)?.dob ?? ''],
      ['Status:', (students.find(s => s.id === studentId)?.status ?? 'active').charAt(0).toUpperCase() + (students.find(s => s.id === studentId)?.status ?? 'active').slice(1)],
    ]
    infoL.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID); doc.text(k, M + 3, 43 + i * 5.5)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT); doc.text(String(v), M + 30, 43 + i * 5.5)
    })
    infoR.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...CRIMSON_MID); doc.text(k, 110, 43 + i * 5.5)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT); doc.text(String(v), 135, 43 + i * 5.5)
    })

    // ── Group results by year → term ──────────────────────────
    const grouped: Record<string, Record<string, typeof allResults>> = {}
    for (const r of allResults) {
      if (!grouped[r.year]) grouped[r.year] = {}
      if (!grouped[r.year][r.term]) grouped[r.year][r.term] = []
      grouped[r.year][r.term].push(r)
    }

    let curY = 64
    const TERM_ORDER = ['Term 1', 'Term 2', 'Term 3']
    const sortedYears = Object.keys(grouped).sort()

    for (const yr of sortedYears) {
      // Year heading
      if (curY > 260) { doc.addPage(); curY = 14 }
      doc.setFillColor(...CRIMSON); doc.rect(M, curY, pw - M * 2, 7, 'F')
      doc.setTextColor(...GOLD); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text(`Academic Year: ${yr}`, M + 4, curY + 5)
      curY += 9

      const sortedTerms = TERM_ORDER.filter(t => grouped[yr][t])
      for (const trm of sortedTerms) {
        const rows = grouped[yr][trm]
        const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length
        const overallGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F'

        // Term sub-heading
        if (curY > 260) { doc.addPage(); curY = 14 }
        doc.setFillColor(245, 235, 215); doc.rect(M, curY, pw - M * 2, 6, 'F')
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.2)
        doc.rect(M, curY, pw - M * 2, 6, 'S')
        doc.setTextColor(...CRIMSON_MID); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
        doc.text(trm, M + 4, curY + 4.2)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
        doc.text(`${rows.length} subject${rows.length !== 1 ? 's' : ''}   Avg: ${avg.toFixed(1)}%   Overall Grade: ${overallGrade}`, M + 24, curY + 4.2)
        curY += 7

        autoTable(doc, {
          startY: curY,
          head: [['Subject', 'CA /50', 'Exam /50', 'Total /100', 'Grade', 'Remark']],
          body: rows.map(r => [
            r.subject?.name ?? '',
            r.ca.toFixed(1),
            (r.exam / 2).toFixed(1),
            r.total.toFixed(1),
            r.grade,
            r.remark ?? '',
          ]),
          theme: 'grid',
          headStyles: { fillColor: CRIMSON_MID, textColor: GOLD, fontSize: 7.5, fontStyle: 'bold', cellPadding: 1.8 },
          bodyStyles: { fontSize: 7.5, textColor: TEXT, cellPadding: 1.8 },
          alternateRowStyles: { fillColor: GOLD_PALE },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 24, halign: 'center' },
            4: { cellWidth: 14, halign: 'center' },
            5: { cellWidth: 'auto' },
          },
          margin: { left: M, right: M },
          tableWidth: pw - M * 2,
        })
        curY = ((doc as any).lastAutoTable?.finalY ?? curY + 20) + 5
      }
      curY += 3
    }

    // ── Signature / seal area ────────────────────────────────
    if (curY > 260) { doc.addPage(); curY = 14 }
    curY += 4
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3)
    doc.line(M, curY + 14, M + 55, curY + 14)
    doc.line(pw - M - 55, curY + 14, pw - M, curY + 14)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...CRIMSON_MID)
    doc.text("Headteacher's Signature", M, curY + 18)
    doc.text('School Stamp / Seal', pw - M - 55, curY + 18)

    // ── Footer ───────────────────────────────────────────────
    const ph = doc.internal.pageSize.getHeight()
    const pages = (doc as any).internal.pages.length - 1
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p)
      doc.setFontSize(6.5); doc.setTextColor(160, 100, 100); doc.setFont('helvetica', 'italic')
      doc.text(`${schoolName} — Official Academic Transcript — ${toTitleCase(student.name)}`, pw / 2, ph - 6, { align: 'center' })
      doc.text(`Page ${p} of ${pages}`, pw - M, ph - 6, { align: 'right' })
    }

    doc.save(`transcript-${toTitleCase(student.name).replace(/\s+/g, '-')}-${student.studentId}.pdf`)
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
        {type === 'transcript' && selectedClass && (
          <div>
            <label style={labelStyle}>Student *</label>
            <select style={{ ...selectStyle, width: 220 }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">Select student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
        )}
        {type !== 'class-list' && type !== 'transcript' && (
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
