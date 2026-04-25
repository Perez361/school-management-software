import { describe, it, expect } from 'vitest'
import { GHANA_CLASSES, GHANA_SUBJECTS, LEVEL_GROUPS } from '../lib/school-data'

describe('GHANA_CLASSES', () => {
  it('contains exactly 11 classes', () => {
    expect(GHANA_CLASSES).toHaveLength(11)
  })

  it('contains 2 Kindergarten classes', () => {
    const kg = GHANA_CLASSES.filter(c => c.level === 'Kindergarten')
    expect(kg).toHaveLength(2)
    expect(kg.map(c => c.name)).toEqual(['KG 1', 'KG 2'])
  })

  it('contains 6 Primary classes', () => {
    const primary = GHANA_CLASSES.filter(c => c.level === 'Primary')
    expect(primary).toHaveLength(6)
    expect(primary.map(c => c.name)).toEqual([
      'Primary 1', 'Primary 2', 'Primary 3',
      'Primary 4', 'Primary 5', 'Primary 6',
    ])
  })

  it('contains 3 JHS classes', () => {
    const jhs = GHANA_CLASSES.filter(c => c.level === 'JHS')
    expect(jhs).toHaveLength(3)
    expect(jhs.map(c => c.name)).toEqual(['JHS 1', 'JHS 2', 'JHS 3'])
  })

  it('every class has a non-empty name and valid level', () => {
    const validLevels = new Set(['Kindergarten', 'Primary', 'JHS'])
    GHANA_CLASSES.forEach(c => {
      expect(c.name.trim()).not.toBe('')
      expect(validLevels.has(c.level)).toBe(true)
    })
  })

  it('all class names are unique', () => {
    const names = GHANA_CLASSES.map(c => c.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('GHANA_SUBJECTS', () => {
  it('contains exactly 14 subjects', () => {
    expect(GHANA_SUBJECTS).toHaveLength(14)
  })

  it('includes core GES subjects', () => {
    const names = GHANA_SUBJECTS.map(s => s.name)
    expect(names).toContain('English Language')
    expect(names).toContain('Mathematics')
    expect(names).toContain('Integrated Science')
    expect(names).toContain('Social Studies')
  })

  it('every subject has a non-empty name and uppercase code', () => {
    GHANA_SUBJECTS.forEach(s => {
      expect(s.name.trim()).not.toBe('')
      expect(s.code.trim()).not.toBe('')
      expect(s.code).toBe(s.code.toUpperCase())
    })
  })

  it('all codes are unique', () => {
    const codes = GHANA_SUBJECTS.map(s => s.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('all names are unique', () => {
    const names = GHANA_SUBJECTS.map(s => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('codes do not exceed 6 characters (DB constraint)', () => {
    GHANA_SUBJECTS.forEach(s => {
      expect(s.code.length).toBeLessThanOrEqual(6)
    })
  })
})

describe('LEVEL_GROUPS', () => {
  it('contains exactly 3 level groups', () => {
    expect(LEVEL_GROUPS).toHaveLength(3)
  })

  it('covers all three levels', () => {
    const levels = LEVEL_GROUPS.map(g => g.level)
    expect(levels).toContain('Kindergarten')
    expect(levels).toContain('Primary')
    expect(levels).toContain('JHS')
  })

  it('every group has a label, color, bg, and border', () => {
    LEVEL_GROUPS.forEach(g => {
      expect(g.label.trim()).not.toBe('')
      expect(g.color.trim()).not.toBe('')
      expect(g.bg.trim()).not.toBe('')
      expect(g.border.trim()).not.toBe('')
    })
  })
})
