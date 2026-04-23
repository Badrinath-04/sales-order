export const metrics = [
  {
    id: 'revenue',
    label: 'Total Revenue (Today)',
    value: '$42,850.00',
    icon: 'payments',
    iconWrapClassName: 'bg-primary-fixed text-primary',
    pill: { text: '+12.5%', className: 'text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full' },
  },
  {
    id: 'orders',
    label: 'Total Orders',
    value: '1,284',
    icon: 'shopping_cart',
    iconWrapClassName: 'bg-secondary-fixed text-secondary',
    pill: { text: '+8.2%', className: 'text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full' },
  },
  {
    id: 'aov',
    label: 'Avg Order Value',
    value: '$33.37',
    icon: 'equalizer',
    iconWrapClassName: 'bg-tertiary-fixed text-tertiary',
    pill: { text: 'Stable', className: 'text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full' },
  },
  {
    id: 'pending',
    label: 'Pending Payments',
    value: '24',
    icon: 'pending_actions',
    iconWrapClassName: 'bg-error-container text-on-error-container',
    pill: { text: 'Alert', className: 'text-xs font-bold text-error bg-error-container px-2 py-1 rounded-full' },
  },
]

export const campusDropdownOptions = [
  { id: 'all', label: 'All Campuses', value: 'all' },
  { id: 'a', label: 'Campus A', value: 'Campus A' },
  { id: 'b', label: 'Campus B', value: 'Campus B' },
  { id: 'c', label: 'Campus C', value: 'Campus C' },
]

const campusInsightImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWTNCqDoS-Q6ZQCz1DAsmdeF4tYjZC6SATRod9sWy8xRf1WsHWS1k4LqntlvU7SHWNALtVB62I_oN4rivco88tKQDOaexLk97rK2Ye38q-Dws3LhnyLM0EjuxN2dtrBGG5FiNfps-VFSo8scTWvlJSn8dTqG8MoYm9kesfOr_p8uxlgXQjYq7bjZNSAywYISHILKmT2i8Rf1qnkxvQj2yuSW0FBBvoWD9vezz9Lyxr7szQdGLnW7yROTJtA1D_WRRZUONJHpuD-0'

/** Per-campus desk view metrics and lists (Sales Overview campus mode). */
export const campusData = {
  'Campus A': {
    sales: 850,
    salesVsYesterday: '+12% vs yesterday',
    completed: 12,
    completedBadge: 'On Track',
    pending: 3,
    recentTransactions: [
      {
        id: 'a1',
        product: 'Full Premium Kit - Grade 9',
        student: 'Jordan Smith',
        time: '10:42 AM',
        amount: '$145.00',
        status: 'paid',
        icon: 'backpack',
      },
      {
        id: 'a2',
        product: 'Science Lab Essentials',
        student: 'Emily Chen',
        time: '09:15 AM',
        amount: '$68.50',
        status: 'paid',
        icon: 'science',
      },
      {
        id: 'a3',
        product: 'Physical Ed Uniform (L)',
        student: 'Marcus Johnson',
        time: '08:30 AM',
        amount: '$42.00',
        status: 'pending',
        icon: 'fitness_center',
      },
    ],
    insight: 'Stock Alert: Grade 7 Math Kits are running low (5 remaining).',
    insightImageUrl: campusInsightImage,
    inventorySnapshots: [
      { id: 'a-tx', label: 'Textbooks', countLabel: '1,240 In Stock', icon: 'auto_stories' },
      { id: 'a-un', label: 'Uniforms', countLabel: '482 In Stock', icon: 'checkroom' },
      { id: 'a-st', label: 'Stationery', countLabel: '2.1k In Stock', icon: 'edit_note' },
      { id: 'a-dv', label: 'Devices', countLabel: '15 In Stock', icon: 'laptop_mac' },
    ],
  },
  'Campus B': {
    sales: 612,
    salesVsYesterday: '+4% vs yesterday',
    completed: 9,
    completedBadge: 'On Track',
    pending: 5,
    recentTransactions: [
      {
        id: 'b1',
        product: 'Starter Kit - Grade 6',
        student: 'Priya Nair',
        time: '11:05 AM',
        amount: '$98.00',
        status: 'paid',
        icon: 'backpack',
      },
      {
        id: 'b2',
        product: 'Art Supplies Bundle',
        student: 'Leo Park',
        time: '09:50 AM',
        amount: '$54.25',
        status: 'pending',
        icon: 'palette',
      },
      {
        id: 'b3',
        product: 'Winter Jacket (M)',
        student: 'Sam Ortiz',
        time: '08:10 AM',
        amount: '$120.00',
        status: 'paid',
        icon: 'checkroom',
      },
    ],
    insight: 'Peak hour approaching: add a second cashier at Window 2.',
    insightImageUrl: campusInsightImage,
    inventorySnapshots: [
      { id: 'b-tx', label: 'Textbooks', countLabel: '890 In Stock', icon: 'auto_stories' },
      { id: 'b-un', label: 'Uniforms', countLabel: '310 In Stock', icon: 'checkroom' },
      { id: 'b-st', label: 'Stationery', countLabel: '1.4k In Stock', icon: 'edit_note' },
      { id: 'b-dv', label: 'Devices', countLabel: '8 In Stock', icon: 'laptop_mac' },
    ],
  },
  'Campus C': {
    sales: 428,
    salesVsYesterday: '-2% vs yesterday',
    completed: 6,
    completedBadge: 'Behind',
    pending: 8,
    recentTransactions: [
      {
        id: 'c1',
        product: 'Device Protection Plan',
        student: 'Ava Thompson',
        time: '10:20 AM',
        amount: '$35.00',
        status: 'paid',
        icon: 'shield',
      },
      {
        id: 'c2',
        product: 'Music Theory Pack',
        student: 'Noah Ibrahim',
        time: '09:00 AM',
        amount: '$72.00',
        status: 'pending',
        icon: 'piano',
      },
      {
        id: 'c3',
        product: 'Lab Goggles + Coat',
        student: 'Riley Fox',
        time: '07:55 AM',
        amount: '$48.00',
        status: 'paid',
        icon: 'science',
      },
    ],
    insight: 'Uniform sizes S and M are below reorder threshold for Campus C.',
    insightImageUrl: campusInsightImage,
    inventorySnapshots: [
      { id: 'c-tx', label: 'Textbooks', countLabel: '520 In Stock', icon: 'auto_stories' },
      { id: 'c-un', label: 'Uniforms', countLabel: '112 In Stock', icon: 'checkroom' },
      { id: 'c-st', label: 'Stationery', countLabel: '980 In Stock', icon: 'edit_note' },
      { id: 'c-dv', label: 'Devices', countLabel: '22 In Stock', icon: 'laptop_mac' },
    ],
  },
}

export const campuses = [
  { id: 'a', letter: 'A', name: 'Campus A', orders: 542, revenue: '$18,240' },
  { id: 'b', letter: 'B', name: 'Campus B', orders: 321, revenue: '$12,450' },
  { id: 'c', letter: 'C', name: 'Campus C', orders: 128, revenue: '$5,120' },
]

export const salesInsights = [
  {
    id: 'top',
    icon: 'trending_up',
    iconClassName: 'material-symbols-outlined text-tertiary-fixed',
    title: 'Top Performing',
    body: 'Campus A (+$5.2k today)',
  },
  {
    id: 'attention',
    icon: 'warning',
    iconClassName: 'material-symbols-outlined text-error-container',
    title: 'Needs Attention',
    body: 'Campus C (Low stock alerts)',
  },
  {
    id: 'pending',
    icon: 'info',
    iconClassName: 'material-symbols-outlined text-secondary-fixed',
    title: 'Payments Pending',
    body: '12 kits awaiting verification',
  },
]

export const salesTrendBars = [
  { id: 'mon', heightClass: 'h-[40%]', emphasized: false },
  { id: 'tue', heightClass: 'h-[65%]', emphasized: false },
  { id: 'wed', heightClass: 'h-[45%]', emphasized: false },
  { id: 'thu', heightClass: 'h-[90%]', emphasized: true, peakLabel: 'Peak: $12k' },
  { id: 'fri', heightClass: 'h-[55%]', emphasized: false },
  { id: 'sat', heightClass: 'h-[70%]', emphasized: false },
  { id: 'sun', heightClass: 'h-[40%]', emphasized: false },
]

export const transactions = [
  {
    id: '1',
    product: 'Essential Grade 4 Kit',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPM0jixK7XHFp6FlsiBWse41nyrMOP74yEojiLrrEGIXPuxxs4x20MVQCj7vx-xmSVFIe-PLMNbkc_F_aIU2Qc2OiCLNpwPaAfRP-zITsWXq39VZWt-qmFuJBiPNrbgeT5uxHaqgNAgPmcI-UDdaazZpR5xTCo209JJx7FfH-h2cq-WuNkekmpvKzNtoz6TJtjfpwhJ9reFNKO-5bmjwlt70YYXhDjauai8loQBg0kil_P1MIx6VMeEc3PSaLDjYQud3Dv5G7ePU8',
    student: 'Michael Chen',
    campus: 'Campus A',
    date: 'Mar 12',
    amount: '$125.00',
    status: 'paid',
  },
  {
    id: '2',
    product: 'Science Lab Deluxe Kit',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB8lVGLVspbl3XgT11K8dFwJ_gHdni6vPiBtKPSeG0HwfX5ANjdPKflSAMkTMh25-cTo-9_hez3OVtq82Pdx90n96a3uXRAN-VKetODmHcsqtib3-jE4RUNvdtusFAgKsNqLUeE5t_8yppVJ6RjzUpxaoIec6jG76vpfvPAQWASymMYMRTs3AueudFwdFenloWDG2E_VjWOav7w6ke2vuEJzoVndfsSs5oblxP-Rrv8SdIWoOkAVDefUaMR1P1fuZYZikWgE7Awo5k',
    student: 'Sarah Jenkins',
    campus: 'Campus B',
    date: 'Mar 12',
    amount: '$89.50',
    status: 'processing',
  },
  {
    id: '3',
    product: 'Art & Design Starter',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBLXMkmiHEfQwo2ERXN6rpAQbySClQXGvRT9m23fqKp1Oq0j2MWWiYVcpI8b6MJUyD6hb3zyzTFtj4eOnlFwLgNflRIXcs7ENwKIiIeaZg1JHutp7_FvATh3P76fubddtLmq1n9_MFvBI3TBPRCglxahegBHqyX9STV8Rj_jZ5NNTkGRwuBgJQlmCs4xcbZPvzk-LyHV7APuC-aPA8yMyWaICH-V5N7TY2ijHkmPky7q8MHAzIIcPmgFFaBsHkCC-fpAKMnG-ZQBZw',
    student: 'Elena Rodriguez',
    campus: 'Campus A',
    date: 'Mar 12',
    amount: '$55.00',
    status: 'pending',
  },
  {
    id: '4',
    product: 'Varsity Sports Uniform',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCd2sMyHQuLDagaeyBpnhT1_f8fLLZ7Uw_UzwFV_EQEDH_aTDCMiOVYDOPneLgxgu_A9x31xk2lN1WJNPUw8pQjvkUuVV4A8xpPYlFua2pHtGcNgb9BIXDESSw32bbGWPXOsZqoIJvMPRITn6dYLqXN1zEUu2kafJloKQUpK7ySo82Yw8j-fGed0k_pFmx4E4gA7Jpdg5rAVKI1ypdIsYN5Qt__sVAP2_yHZOgmV_tknJHSoc1yVdYYaHXiUM9Ez5twXvtAmJlQlME',
    student: 'David Miller',
    campus: 'Campus C',
    date: 'Mar 12',
    amount: '$210.00',
    status: 'paid',
  },
]
