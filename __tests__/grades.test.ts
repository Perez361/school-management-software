import { describe, it, expect } from 'vitest'
import {
  getGrade,
  getRemark,
  calculateTotal,
  rankStudents,
  getPositionSuffix,
} from '../lib/grades'

describe('getGrade', () => {
  it('returns A for 80 and above', () => {
    expect(getGrade(80)).toBe('A')
    expect(getGrade(100)).toBe('A')
    expect(getGrade(95)).toBe('A')
  })

  it('returns B for 70–79', () => {
    expect(getGrade(70)).toBe('B')
    expect(getGrade(79)).toBe('B')
    expect(getGrade(75)).toBe('B')
  })

  it('returns C for 60–69', () => {
    expect(getGrade(60)).toBe('C')
    expect(getGrade(69)).toBe('C')
  })

  it('returns D for 50–59', () => {
    expect(getGrade(50)).toBe('D')
    expect(getGrade(59)).toBe('D')
  })

  it('returns E for 40–49', () => {
    expect(getGrade(40)).toBe('E')
    expect(getGrade(49)).toBe('E')
  })

  it('returns F for below 40', () => {
    expect(getGrade(39)).toBe('F')
    expect(getGrade(0)).toBe('F')
  })
})

describe('getRemark', () => {
  it('maps grade thresholds to correct remarks', () => {
    expect(getRemark(80)).toBe('Excellent')
    expect(getRemark(70)).toBe('Very Good')
    expect(getRemark(60)).toBe('Good')
    expect(getRemark(50)).toBe('Average')
    expect(getRemark(40)).toBe('Below Average')
    expect(getRemark(39)).toBe('Unsatisfactory')
    expect(getRemark(0)).toBe('Unsatisfactory')
  })

  it('boundary: 79 is Very Good, 80 is Excellent', () => {
    expect(getRemark(79)).toBe('Very Good')
    expect(getRemark(80)).toBe('Excellent')
  })
})

describe('calculateTotal', () => {
  it('adds CA and exam scores', () => {
    expect(calculateTotal(30, 70)).toBe(100)
    expect(calculateTotal(0, 0)).toBe(0)
    expect(calculateTotal(15, 35)).toBe(50)
  })

  it('rounds to one decimal place', () => {
    expect(calculateTotal(14.5, 35.7)).toBe(50.2)
    expect(calculateTotal(10.3, 20.6)).toBe(30.9)
  })
})

describe('rankStudents', () => {
  it('returns an empty array for empty input', () => {
    expect(rankStudents([])).toEqual([])
  })

  it('assigns position 1 to a single student', () => {
    const result = rankStudents([
      { studentId: 1, name: 'Kofi', results: [{ total: 75 }] },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].position).toBe(1)
    expect(result[0].totalScore).toBe(75)
  })

  it('sorts students by average score descending', () => {
    const result = rankStudents([
      { studentId: 2, name: 'Ama',  results: [{ total: 60 }] },
      { studentId: 1, name: 'Kofi', results: [{ total: 80 }] },
      { studentId: 3, name: 'Kwesi',results: [{ total: 70 }] },
    ])
    expect(result[0].name).toBe('Kofi')
    expect(result[1].name).toBe('Kwesi')
    expect(result[2].name).toBe('Ama')
  })

  it('assigns correct sequential positions', () => {
    const result = rankStudents([
      { studentId: 1, name: 'A', results: [{ total: 90 }] },
      { studentId: 2, name: 'B', results: [{ total: 75 }] },
      { studentId: 3, name: 'C', results: [{ total: 60 }] },
    ])
    expect(result[0].position).toBe(1)
    expect(result[1].position).toBe(2)
    expect(result[2].position).toBe(3)
  })

  it('gives tied students the same position', () => {
    const result = rankStudents([
      { studentId: 1, name: 'A', results: [{ total: 80 }] },
      { studentId: 2, name: 'B', results: [{ total: 80 }] },
      { studentId: 3, name: 'C', results: [{ total: 70 }] },
    ])
    expect(result[0].position).toBe(1)
    expect(result[1].position).toBe(1)
    expect(result[2].position).toBe(3)
  })

  it('averages multiple subject scores', () => {
    const result = rankStudents([
      { studentId: 1, name: 'A', results: [{ total: 60 }, { total: 80 }] },
    ])
    expect(result[0].totalScore).toBe(70)
    expect(result[0].subjectCount).toBe(2)
  })

  it('gives 0 score and correct count for student with no results', () => {
    const result = rankStudents([
      { studentId: 1, name: 'A', results: [] },
    ])
    expect(result[0].totalScore).toBe(0)
    expect(result[0].subjectCount).toBe(0)
  })
})

describe('getPositionSuffix', () => {
  it('appends st for 1, 21, 31', () => {
    expect(getPositionSuffix(1)).toBe('1st')
    expect(getPositionSuffix(21)).toBe('21st')
    expect(getPositionSuffix(31)).toBe('31st')
  })

  it('appends nd for 2, 22, 32', () => {
    expect(getPositionSuffix(2)).toBe('2nd')
    expect(getPositionSuffix(22)).toBe('22nd')
  })

  it('appends rd for 3, 23, 33', () => {
    expect(getPositionSuffix(3)).toBe('3rd')
    expect(getPositionSuffix(23)).toBe('23rd')
  })

  it('appends th for 4–20 and teen numbers', () => {
    expect(getPositionSuffix(4)).toBe('4th')
    expect(getPositionSuffix(10)).toBe('10th')
    expect(getPositionSuffix(11)).toBe('11th')
    expect(getPositionSuffix(12)).toBe('12th')
    expect(getPositionSuffix(13)).toBe('13th')
    expect(getPositionSuffix(20)).toBe('20th')
  })
})
