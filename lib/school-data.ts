// Ghana Education Service (GES) standard school structure

export interface GhanaClass {
  name: string
  level: 'Kindergarten' | 'Primary' | 'JHS'
}

export const GHANA_CLASSES: GhanaClass[] = [
  { name: 'KG 1',      level: 'Kindergarten' },
  { name: 'KG 2',      level: 'Kindergarten' },
  { name: 'Primary 1', level: 'Primary' },
  { name: 'Primary 2', level: 'Primary' },
  { name: 'Primary 3', level: 'Primary' },
  { name: 'Primary 4', level: 'Primary' },
  { name: 'Primary 5', level: 'Primary' },
  { name: 'Primary 6', level: 'Primary' },
  { name: 'JHS 1',     level: 'JHS' },
  { name: 'JHS 2',     level: 'JHS' },
  { name: 'JHS 3',     level: 'JHS' },
]

export const LEVEL_GROUPS: { label: string; level: GhanaClass['level']; color: string; bg: string; border: string }[] = [
  { label: 'Kindergarten', level: 'Kindergarten', color: '#b45309', bg: 'rgba(180,83,9,0.08)',   border: 'rgba(180,83,9,0.2)'   },
  { label: 'Primary',      level: 'Primary',      color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  { label: 'JHS',          level: 'JHS',          color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)', border: 'rgba(139,26,26,0.2)'  },
]

export interface GhanaSubject {
  name: string
  code: string
}

export const GHANA_SUBJECTS: GhanaSubject[] = [
  { name: 'English Language',          code: 'ENG'  },
  { name: 'Mathematics',               code: 'MATH' },
  { name: 'Integrated Science',        code: 'SCI'  },
  { name: 'Social Studies',            code: 'SOC'  },
  { name: 'Religious & Moral Education', code: 'RME' },
  { name: 'Creative Arts & Design',    code: 'CAD'  },
  { name: 'Computing',                 code: 'ICT'  },
  { name: 'French',                    code: 'FRE'  },
  { name: 'Ghanaian Language',         code: 'GHL'  },
  { name: 'Physical Education',        code: 'PE'   },
  { name: 'History',                   code: 'HIST' },
  { name: 'Career Technology',         code: 'CT'   },
  { name: 'Agricultural Science',      code: 'AGRI' },
  { name: 'Pre-Technical Skills',      code: 'PTS'  },
]
