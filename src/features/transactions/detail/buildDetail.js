/** Default detail payload when opening by URL or minimal list row */
const DEFAULT = {
  bookBadge: 'Academic Year 2024-25',
  uniformBadge: 'House: Blue',
  bookLines: [
    {
      icon: 'menu_book',
      iconBg: 'bg-primary-fixed text-primary',
      title: 'Mandatory Workbooks',
      subtitle: 'Set of 12 subjects',
      price: 120,
    },
    {
      icon: 'auto_stories',
      iconBg: 'bg-surface-container-high text-on-surface-variant',
      title: 'Optional Textbooks',
      subtitle: 'Reference library bundle',
      price: 85,
    },
    {
      icon: 'edit_note',
      iconBg: 'bg-surface-container-high text-on-surface-variant',
      title: 'Optional Notebooks',
      subtitle: '200pg Ruled (Pack of 10)',
      price: 25,
    },
  ],
  uniformItems: [
    { title: 'Oxford Shirt', detail: 'Size: M • White • Long Sleeve' },
    { title: 'Cotton Trousers', detail: 'Size: 32 • Navy Blue' },
    { title: 'Logo Socks', detail: 'Size: L • Pack of 3' },
    { title: 'Accessories', detail: 'Belt & Tie (Included)' },
  ],
  student: {
    name: 'Arjun Malhotra',
    studentId: '#ST-9920',
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAB175PaST4iPX3cyfzJkpgG0SKBNBsrE7nwQ6nPR45X1D1QjnKxlsQ0AnSE0H02GF1nCEp6Eh1pNjbojv2Yu93TizxjlwW5dEflHF-Ml96yEmBARB1ZNv0bE_z-VWZlp7PbDspCpNoG_KhkFwNP5Axy8AYpiTbhVQaclVGNWuZKdfL7FHK78SKehcFk3RLv_Q9Z6QiRwVpv1WrZWxvYukXbJpOumEr0uRbllS5c9yH3bO2RXzwCEgD7gh6s8ClW2rWtxJsDZtqFjk',
    classShort: '6-A',
    section: 'Academic',
    phone: '+91 98765 43210',
  },
  financial: {
    subtotal: 510,
    platformFee: 12.5,
    vatLabel: 'VAT (8%)',
    vatAmount: 35.1,
    total: 557.6,
    paymentMode: 'Online (Stripe)',
    referenceId: 'ch_3N4yU7L2vO9kS1f91X5aB',
    paidTimestamp: '24 Oct 2024, 10:47:12',
  },
}

export function buildTransactionDetail(id, state) {
  const s = state ?? {}
  const classMatch = typeof s.classLabel === 'string' ? s.classLabel.match(/Class\s+(.+)/i) : null
  const classShort = classMatch ? classMatch[1].trim() : DEFAULT.student.classShort

  return {
    id: String(id),
    orderId: s.orderId ?? '#SKM-2024-8842',
    status: s.status ?? 'Paid',
    orderedLine: s.orderedLine ?? 'Ordered on Oct 24, 2024 • 10:45 AM',
    bookBadge: DEFAULT.bookBadge,
    uniformBadge: DEFAULT.uniformBadge,
    bookLines: DEFAULT.bookLines,
    uniformItems: DEFAULT.uniformItems,
    student: {
      ...DEFAULT.student,
      name: s.studentName ?? DEFAULT.student.name,
      classShort,
      section: DEFAULT.student.section,
      phone: DEFAULT.student.phone,
      studentId: s.studentId ?? DEFAULT.student.studentId,
    },
    financial: DEFAULT.financial,
  }
}
