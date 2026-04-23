export const classes = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Class ${index + 1}`,
  students: 120,
}))

export const sections = [
  { id: 'A', name: 'Section A', students: 30 },
  { id: 'B', name: 'Section B', students: 30 },
  { id: 'C', name: 'Section C', students: 30 },
  { id: 'D', name: 'Section D', students: 30 },
]

export const rosterDefaults = {
  totalStudents: 42,
  unpaidCount: 8,
  kitsDistributedPercent: 85,
  pendingPayments: 12,
}

export const students = [
  {
    id: 1,
    name: 'Arjun Adhikari',
    roll: '6A001',
    books: 'Taken',
    uniform: 'Complete',
    payment: 'Paid',
    guardian: 'Mohan Adhikari',
    parentPhone: '+1 (555) 219-1001',
    initials: 'AA',
    avatarTone: 'primary',
  },
  {
    id: 2,
    name: 'Bina Kumari',
    roll: '6A002',
    books: 'Partial',
    uniform: 'Pending',
    payment: 'Unpaid',
    guardian: 'Sita Devi',
    parentPhone: '+1 (555) 219-1002',
    initials: 'BK',
    avatarTone: 'secondary',
  },
  {
    id: 3,
    name: 'Deepak Khanal',
    roll: '6A003',
    books: 'Taken',
    uniform: 'Pending',
    payment: 'Partial',
    guardian: 'Ram Khanal',
    parentPhone: '+1 (555) 219-1003',
    initials: 'DK',
    avatarTone: 'primary',
  },
  {
    id: 4,
    name: 'Pooja Sharma',
    roll: '6A004',
    books: 'Not Taken',
    uniform: 'Complete',
    payment: 'Paid',
    guardian: 'Laxmi Sharma',
    parentPhone: '+1 (555) 219-1004',
    initials: 'PS',
    avatarTone: 'tertiary',
  },
]

export const filterTabs = [
  { id: 'all', label: 'All Students' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partial', label: 'Partial' },
]
