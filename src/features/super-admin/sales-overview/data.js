/** Static demo / fallback content for sales overview UI (used when API data is loading). */

export const metrics = [
  {
    id: 'revenue',
    label: 'Total Revenue (Today)',
    value: '$42,850.00',
    icon: 'payments',
    iconWrapClassName: 'rounded-lg bg-primary/10 p-2 text-primary',
    pill: { text: '+12.5%', className: 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700' },
  },
  {
    id: 'orders',
    label: 'Total Orders',
    value: '1,284',
    icon: 'shopping_cart',
    iconWrapClassName: 'rounded-lg bg-primary/10 p-2 text-primary',
    pill: { text: '+8.2%', className: 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700' },
  },
  {
    id: 'avg',
    label: 'Avg Order Value',
    value: '$33.37',
    icon: 'bar_chart',
    iconWrapClassName: 'rounded-lg bg-orange-100 p-2 text-orange-700',
    pill: { text: 'Stable', className: 'rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600' },
  },
  {
    id: 'pending',
    label: 'Pending Revenue',
    value: '$2,450.00',
    icon: 'account_balance_wallet',
    iconWrapClassName: 'rounded-lg bg-amber-100 p-2 text-amber-800',
    pill: { text: 'Outstanding', className: 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900' },
  },
]

export const salesTrendBars = [
  { id: 'mon', heightClass: 'h-[35%]', emphasized: false, peakLabel: null },
  { id: 'tue', heightClass: 'h-[48%]', emphasized: false, peakLabel: null },
  { id: 'wed', heightClass: 'h-[42%]', emphasized: false, peakLabel: null },
  { id: 'thu', heightClass: 'h-[85%]', emphasized: true, peakLabel: 'Peak: $12k' },
  { id: 'fri', heightClass: 'h-[55%]', emphasized: false, peakLabel: null },
  { id: 'sat', heightClass: 'h-[28%]', emphasized: false, peakLabel: null },
  { id: 'sun', heightClass: 'h-[32%]', emphasized: false, peakLabel: null },
]

export const salesInsights = [
  {
    id: 'top',
    icon: 'trending_up',
    iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white',
    title: 'Top Performing',
    body: 'Campus A (+$5.2k today)',
  },
  {
    id: 'attention',
    icon: 'warning',
    iconClassName: 'material-symbols-outlined shrink-0 text-xl text-amber-200',
    title: 'Needs Attention',
    body: 'Campus C (Low stock alerts)',
  },
  {
    id: 'kits',
    icon: 'info',
    iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white/90',
    title: 'Pending revenue (network)',
    body: '$12,400 outstanding on orders in this period',
  },
]

export const campuses = [
  { id: 'a', letter: 'A', name: 'Campus A', orders: '542 Orders', revenue: '$18,240' },
  { id: 'b', letter: 'B', name: 'Campus B', orders: '421 Orders', revenue: '$14,890' },
  { id: 'c', letter: 'C', name: 'Campus C', orders: '321 Orders', revenue: '$11,720' },
]

export const transactions = [
  {
    id: 't1',
    product: 'Grade 8 Academic Kit',
    student: 'Sarah Ahmed',
    campus: 'Campus A',
    date: 'Oct 24, 2025',
    amount: '$450.00',
    status: 'paid',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=120&q=60',
  },
  {
    id: 't2',
    product: 'Sports Uniform Set',
    student: 'James Wilson',
    campus: 'Campus B',
    date: 'Oct 24, 2025',
    amount: '$120.50',
    status: 'processing',
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-7afc498a9fce?auto=format&fit=crop&w=120&q=60',
  },
  {
    id: 't3',
    product: 'Lab Equipment Fee',
    student: 'Emily Chen',
    campus: 'Campus A',
    date: 'Oct 23, 2025',
    amount: '$85.00',
    status: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=120&q=60',
  },
]

export const campusDropdownOptions = [
  { id: 'all', label: 'All Campuses', value: 'all' },
  { id: 'campus-a', label: 'Campus A', value: 'CAMP-A' },
  { id: 'campus-b', label: 'Campus B', value: 'CAMP-B' },
  { id: 'campus-c', label: 'Campus C', value: 'CAMP-C' },
]

const placeholderImg =
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=120&q=60'

export const campusData = {
  'CAMP-A': {
    sales: '18,240',
    salesVsYesterday: '+5.2%',
    completed: '542',
    completedBadge: '+12%',
    pending: '8',
    insight: 'Stock levels healthy for core textbooks.',
    insightImageUrl: null,
    recentTransactions: [
      {
        id: 'r1',
        product: 'Grade Kit Order',
        student: 'Student A',
        time: '10:42 AM',
        amount: '$450.00',
        status: 'paid',
        icon: 'receipt_long',
      },
      {
        id: 'r2',
        product: 'Uniform bundle',
        student: 'Student B',
        time: '11:05 AM',
        amount: '$120.00',
        status: 'paid',
        icon: 'checkroom',
      },
    ],
    inventorySnapshots: [
      { id: 'bk', label: 'Textbooks', countLabel: '2,400 In Stock', icon: 'auto_stories' },
      { id: 'un', label: 'Uniforms', countLabel: '890 In Stock', icon: 'checkroom' },
      { id: 'ac', label: 'Accessories', countLabel: '340 In Stock', icon: 'backpack' },
      { id: 'sp', label: 'Sports', countLabel: '120 In Stock', icon: 'sports_soccer' },
    ],
  },
  'CAMP-B': {
    sales: '14,890',
    salesVsYesterday: '+2.1%',
    completed: '421',
    completedBadge: 'On Track',
    pending: '12',
    insight: 'Consider restocking UKG workbooks.',
    insightImageUrl: null,
    recentTransactions: [
      {
        id: 'b1',
        product: 'Semester Kit',
        student: 'Student C',
        time: '9:15 AM',
        amount: '$380.00',
        status: 'pending',
        icon: 'receipt_long',
      },
    ],
    inventorySnapshots: [
      { id: 'bk', label: 'Textbooks', countLabel: '1,900 In Stock', icon: 'auto_stories' },
      { id: 'un', label: 'Uniforms', countLabel: '760 In Stock', icon: 'checkroom' },
      { id: 'ac', label: 'Accessories', countLabel: '280 In Stock', icon: 'backpack' },
      { id: 'sp', label: 'Sports', countLabel: '95 In Stock', icon: 'sports_soccer' },
    ],
  },
  'CAMP-C': {
    sales: '11,720',
    salesVsYesterday: '-1.3%',
    completed: '321',
    completedBadge: 'Watch',
    pending: '18',
    insight: 'Low stock alerts on Class 5 kits.',
    insightImageUrl: null,
    recentTransactions: [
      {
        id: 'c1',
        product: 'Lab fee bundle',
        student: 'Student D',
        time: '3:20 PM',
        amount: '$95.00',
        status: 'paid',
        icon: 'science',
      },
    ],
    inventorySnapshots: [
      { id: 'bk', label: 'Textbooks', countLabel: '1,450 In Stock', icon: 'auto_stories' },
      { id: 'un', label: 'Uniforms', countLabel: '620 In Stock', icon: 'checkroom' },
      { id: 'ac', label: 'Accessories', countLabel: '210 In Stock', icon: 'backpack' },
      { id: 'sp', label: 'Sports', countLabel: '70 In Stock', icon: 'sports_soccer' },
    ],
  },
}
