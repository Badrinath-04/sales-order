export const salesStats = [
  {
    id: 'today-sales',
    label: "Today's revenue",
    value: '$850',
    icon: 'payments',
    iconWrapClassName: 'p-3 bg-primary/10 rounded-xl text-primary',
    topRight: {
      kind: 'text',
      text: '+12% vs yesterday',
      className: 'text-tertiary text-xs font-bold uppercase tracking-widest',
    },
  },
  {
    id: 'orders-completed',
    label: 'Orders Completed',
    value: '12',
    icon: 'task_alt',
    iconWrapClassName: 'p-3 bg-secondary-container/30 rounded-xl text-secondary',
    topRight: {
      kind: 'pill',
      text: 'On Track',
      className:
        'bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
    },
  },
  {
    id: 'pending-orders',
    label: 'Pending Orders',
    value: '3',
    icon: 'pending_actions',
    iconWrapClassName: 'p-3 bg-tertiary/10 rounded-xl text-tertiary',
    topRight: {
      kind: 'pulseDot',
    },
  },
]

export const recentTransactions = [
  {
    id: 'tx-1',
    title: 'Full Premium Kit - Grade 9',
    meta: 'Jordan Smith • 10:42 AM',
    amount: '$145.00',
    icon: 'backpack',
    badgeText: 'PAID',
    badgeClassName:
      'text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold uppercase',
  },
  {
    id: 'tx-2',
    title: 'Science Lab Essentials',
    meta: 'Emily Chen • 09:15 AM',
    amount: '$68.50',
    icon: 'science',
    badgeText: 'PAID',
    badgeClassName:
      'text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold uppercase',
  },
  {
    id: 'tx-3',
    title: 'Physical Ed Uniform (L)',
    meta: 'Marcus Johnson • 08:30 AM',
    amount: '$42.00',
    icon: 'fitness_center',
    badgeText: 'PENDING',
    badgeClassName:
      'text-[10px] bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full font-bold uppercase',
  },
]

export const inventorySnapshots = [
  {
    id: 'inv-textbooks',
    label: 'Textbooks',
    summary: '1,240 In Stock',
    icon: 'auto_stories',
  },
  {
    id: 'inv-uniforms',
    label: 'Uniforms',
    summary: '482 In Stock',
    icon: 'checkroom',
  },
  {
    id: 'inv-stationery',
    label: 'Stationery',
    summary: '2.1k In Stock',
    icon: 'edit_note',
  },
  {
    id: 'inv-devices',
    label: 'Devices',
    summary: '15 In Stock',
    icon: 'laptop_mac',
  },
]
