/** Fallback when opening payment without navigation state */
export const fallbackPaymentContext = {
  selectedClass: { id: 4, name: 'Class 4' },
  selectedSection: { id: 'B', name: 'Section B' },
  student: {
    id: 'demo-pay',
    name: 'Arjun Sharma',
    roll: '4B001',
    parentPhone: '+1 (555) 000-0000',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCjP8LSuLGsU8SVSHrtl-ckdinFH-WjeRRE1BmUjYu9WQUzDft2_2kdfXfRr01Ic3fS413-dgfru9O8_P00NgfPhIKBr5z7x23kh6z61Yb-Mbfr-h6BN00A2Pp-rD1JGfisdYEvsvY8NNekVwUKW74C0Y112CHvuvttCsAqR3RYSSaLMGV2zemtR677Ps0erTsPcCjeZu4P7zkqTHpJpBeINzKgXURO2Wys2n8pe4y2NmvycBBuzgByGrXpbbhsMf6LDoi-AZlQ7XI',
  },
  orderDetails: {
    bookKit: [
      { label: 'Standard 4 Textbook Set (12 items)', price: 120 },
      { label: 'Workbooks & Notebooks Set', price: 45 },
    ],
    uniformKit: [
      { label: 'Cotton Shirt (White, Size 32) x2', price: 30 },
      { label: 'Trousers (Navy, Size 30) x2', price: 40 },
      { label: 'School Blazer (Size M)', price: 65 },
    ],
    subtotal: 300,
    administrativeFee: 5,
    total: 305,
  },
}
