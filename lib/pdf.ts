// src/lib/pdf.ts
// PDF generation for report cards and fee invoices
// Uses jsPDF + jspdf-autotable

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getGrade, getRemark, getPositionSuffix } from './grades'

interface ReportCardData {
  school: { name: string; motto?: string; address?: string; phone?: string }
  student: { name: string; studentId: string; class: string; gender: string }
  term: string
  year: string
  position: number
  totalStudents: number
  results: { subject: string; ca: number; exam: number; total: number }[]
  teacherRemark?: string
  headRemark?: string
}

export function generateReportCard(data: ReportCardData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(67, 56, 202) // brand-700
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.school.name.toUpperCase(), pageWidth / 2, 12, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text(data.school.motto || '', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.school.address || '', pageWidth / 2, 27, { align: 'center' })

  // Report Card Title
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMINAL REPORT CARD', pageWidth / 2, 42, { align: 'center' })

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.term} — Academic Year ${data.year}`, pageWidth / 2, 49, { align: 'center' })

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 53, pageWidth - 14, 53)

  // Student Info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  const col1X = 14, col2X = 110
  let y = 62

  const infoItems = [
    ['Student Name:', data.student.name],
    ['Student ID:', data.student.studentId],
    ['Class:', data.student.class],
    ['Gender:', data.student.gender],
  ]

  infoItems.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1X : col2X
    if (i % 2 === 0 && i > 0) y += 8
    doc.setFont('helvetica', 'bold')
    doc.text(label, x, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, x + 35, y)
  })

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Position:', col1X, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(67, 56, 202)
  doc.text(`${getPositionSuffix(data.position)} out of ${data.totalStudents} students`, col1X + 35, y)

  doc.setTextColor(0, 0, 0)
  y += 12

  // Results Table
  const tableData = data.results.map(r => [
    r.subject,
    r.ca.toFixed(1),
    r.exam.toFixed(1),
    r.total.toFixed(1),
    getGrade(r.total),
    getRemark(r.total),
  ])

  ;(doc as any).autoTable({
    startY: y,
    head: [['Subject', 'CA (30)', 'Exam (70)', 'Total (100)', 'Grade', 'Remark']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    columnStyles: {
      0: { cellWidth: 55 },
      4: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Summary
  const avg = data.results.reduce((s, r) => s + r.total, 0) / (data.results.length || 1)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Overall Average: ${avg.toFixed(1)}%`, 14, finalY)
  doc.text(`Overall Grade: ${getGrade(avg)}`, 80, finalY)

  // Remarks
  let ry = finalY + 12
  doc.setDrawColor(200)
  doc.rect(14, ry, pageWidth - 28, 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text("Class Teacher's Remark:", 17, ry + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(data.teacherRemark || '___________________________', 70, ry + 7)
  doc.text('Signature: ____________________', 17, ry + 16)

  ry += 28
  doc.rect(14, ry, pageWidth - 28, 22)
  doc.setFont('helvetica', 'bold')
  doc.text("Head's Remark:", 17, ry + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(data.headRemark || '___________________________', 55, ry + 7)
  doc.text('Signature: ____________________', 17, ry + 16)

  // Footer
  const footY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GH')} — ${data.school.name}`, pageWidth / 2, footY, { align: 'center' })

  return doc
}

interface InvoiceData {
  school: { name: string; address?: string; phone?: string }
  student: { name: string; studentId: string; class: string }
  term: string
  year: string
  items: { description: string; amount: number; paid: number; balance: number }[]
}

export function generateFeeInvoice(data: InvoiceData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(22, 163, 74) // green
  doc.rect(0, 0, pageWidth, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.school.name.toUpperCase(), pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.school.address || '', pageWidth / 2, 22, { align: 'center' })

  doc.setTextColor(22, 163, 74)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FEE INVOICE', pageWidth / 2, 42, { align: 'center' })

  doc.setTextColor(0)
  doc.setFontSize(10)
  let y = 55
  doc.setFont('helvetica', 'bold')
  doc.text('Student:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.student.name, 50, y)
  doc.setFont('helvetica', 'bold')
  doc.text('ID:', 110, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.student.studentId, 120, y)

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Class:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.student.class, 50, y)
  doc.setFont('helvetica', 'bold')
  doc.text('Term:', 110, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.term} / ${data.year}`, 125, y)

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Date:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('en-GH'), 50, y)

  ;(doc as any).autoTable({
    startY: y + 10,
    head: [['Fee Item', 'Amount (GHS)', 'Paid (GHS)', 'Balance (GHS)']],
    body: data.items.map(i => [
      i.description,
      i.amount.toFixed(2),
      i.paid.toFixed(2),
      i.balance.toFixed(2),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 255, 240] },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 8
  const totalBalance = data.items.reduce((s, i) => s + i.balance, 0)
  const totalPaid = data.items.reduce((s, i) => s + i.paid, 0)
  const totalDue = data.items.reduce((s, i) => s + i.amount, 0)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Due: GHS ${totalDue.toFixed(2)}`, 14, finalY)
  doc.text(`Total Paid: GHS ${totalPaid.toFixed(2)}`, 80, finalY)
  doc.setTextColor(totalBalance > 0 ? 220 : 22, totalBalance > 0 ? 38 : 163, totalBalance > 0 ? 38 : 74)
  doc.text(`Outstanding: GHS ${totalBalance.toFixed(2)}`, 146, finalY)

  return doc
}
