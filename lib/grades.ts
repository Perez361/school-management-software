// src/lib/grades.ts

export function getGrade(total: number): string {
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'D'
  if (total >= 40) return 'E'
  return 'F'
}

export function getRemark(total: number): string {
  if (total >= 80) return 'Excellent'
  if (total >= 70) return 'Very Good'
  if (total >= 60) return 'Good'
  if (total >= 50) return 'Average'
  if (total >= 40) return 'Below Average'
  return 'Unsatisfactory'
}

export function calculateTotal(ca: number, exam: number): number {
  // CA is out of 30, Exam is out of 70
  return Math.round((ca + exam) * 10) / 10
}

export interface StudentRanking {
  studentId: number
  name: string
  totalScore: number
  position: number
  subjectCount: number
}

export function rankStudents(
  students: { studentId: number; name: string; results: { total: number }[] }[]
): StudentRanking[] {
  // Calculate average or aggregate score per student
  const withScores = students.map(s => ({
    studentId: s.studentId,
    name: s.name,
    subjectCount: s.results.length,
    totalScore: s.results.length > 0
      ? s.results.reduce((sum, r) => sum + r.total, 0) / s.results.length
      : 0,
    position: 0,
  }))

  // Sort descending
  withScores.sort((a, b) => b.totalScore - a.totalScore)

  // Assign positions (ties get same position)
  let position = 1
  for (let i = 0; i < withScores.length; i++) {
    if (i > 0 && withScores[i].totalScore < withScores[i - 1].totalScore) {
      position = i + 1
    }
    withScores[i].position = position
  }

  return withScores
}

export function getPositionSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
