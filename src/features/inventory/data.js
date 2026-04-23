export const booksKpiRow = [
  {
    id: 'books',
    title: 'Books Stock',
    value: '12,480',
    subtitle: 'units across all classes',
    icon: 'menu_book',
    badge: 'ACTIVE VIEW',
  },
  {
    id: 'uniforms',
    title: 'Uniforms Stock',
    value: '4,215',
    subtitle: 'units currently tracked',
    icon: 'apparel',
    badge: 'ACTIVE VIEW',
  },
]

export const classList = [
  { id: '01', label: 'Class 1' },
  { id: '02', label: 'Class 2' },
  { id: '03', label: 'Class 3' },
  { id: '04', label: 'Class 4' },
  { id: '05', label: 'Class 5' },
  { id: '06', label: 'Class 6', showEdit: true },
  { id: '07', label: 'Class 7' },
  { id: '08', label: 'Class 8' },
  { id: '09', label: 'Class 9' },
  { id: '10', label: 'Class 10' },
  { id: '11', label: 'Class 11' },
  { id: '12', label: 'Class 12' },
]

export const kitDetailsByClass = {
  '06': {
    title: 'Class 6 Kit Details',
    lastUpdated: 'Last updated: 2 hours ago',
    badge: 'Academic Kit A',
    lines: [
      {
        id: 'textbooks',
        label: 'Textbooks (Set of 8)',
        icon: 'library_books',
        stock: 142,
        price: 85.0,
      },
      {
        id: 'workbooks',
        label: 'Workbooks (Semester 1)',
        icon: 'edit_note',
        stock: 85,
        price: 12.5,
      },
      {
        id: 'notebooks',
        label: 'Notebooks (Lined/Grid)',
        icon: 'subject',
        stock: 312,
        price: 4.75,
      },
    ],
  },
}

export const uniformCategories = [
  { id: 'shirt', label: 'Shirt', icon: 'apparel', selected: true },
  { id: 'pant', label: 'Pant', icon: 'line_weight', selected: false },
  { id: 'socks', label: 'Socks', icon: 'footprint', selected: false },
  { id: 'belt', label: 'Belt', icon: 'straighten', selected: false },
  { id: 'tie', label: 'Tie', icon: 'cleaning_services', selected: false },
]

export const sizeInventory = [
  {
    id: 'xs',
    code: 'XS',
    name: 'Extra Small',
    stock: 420,
    stockLabel: '420 Units',
    priceLabel: '$18.50',
    tone: 'normal',
    action: { type: 'add', label: 'Add Stock', icon: 'add' },
  },
  {
    id: 's',
    code: 'S',
    name: 'Small',
    stock: 845,
    stockLabel: '845 Units',
    priceLabel: '$18.50',
    tone: 'normal',
    action: { type: 'add', label: 'Add Stock', icon: 'add' },
  },
  {
    id: 'm',
    code: 'M',
    name: 'Medium',
    stock: 12,
    stockLabel: '12 Units',
    priceLabel: '$19.99',
    tone: 'low',
    alertLabel: 'Low Stock Alert',
    action: { type: 'restock', label: 'Restock Now', icon: 'bolt' },
  },
  {
    id: 'l',
    code: 'L',
    name: 'Large',
    stock: 1210,
    stockLabel: '1,210 Units',
    priceLabel: '$19.99',
    tone: 'normal',
    action: { type: 'add', label: 'Add Stock', icon: 'add' },
  },
  {
    id: 'xl',
    code: 'XL',
    name: 'Extra Large',
    stock: 634,
    stockLabel: '634 Units',
    priceLabel: '$22.00',
    tone: 'normal',
    action: { type: 'add', label: 'Add Stock', icon: 'add' },
  },
  {
    id: 'xxl',
    code: 'XXL',
    name: 'Double Extra Large',
    stock: 215,
    stockLabel: '215 Units',
    priceLabel: '$24.50',
    tone: 'normal',
    action: { type: 'add', label: 'Add Stock', icon: 'add' },
  },
]

export const booksStats = booksKpiRow
export const uniformStats = booksKpiRow
export const kitDetails = kitDetailsByClass

export const accessoriesOverview = {
  title: 'Accessories Inventory',
  description: 'Track add-ons, lab gear, and optional items in one consolidated workspace.',
  groups: [
    {
      id: 'bags',
      label: 'Bags & Backpacks',
      countLabel: '186 SKUs',
      icon: 'backpack',
    },
    {
      id: 'tech',
      label: 'Tech Accessories',
      countLabel: '42 SKUs',
      icon: 'devices',
    },
    {
      id: 'sports',
      label: 'Sports Add-ons',
      countLabel: '74 SKUs',
      icon: 'sports_soccer',
    },
  ],
}
