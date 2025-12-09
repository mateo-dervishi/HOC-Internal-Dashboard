import type { OperationalCost } from '../types';

// Generate a unique ID
const generateId = () => crypto.randomUUID();

// Helper to create a date string
const date = (year: number, month: number, day: number = 1) => 
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/**
 * House of Clarence Operational Costs Data
 * 
 * WAREHOUSE (Starting January 2026)
 * - Professional fees: £13,116.60 (inc VAT)
 * - Rental deposit: £179,743.20 (7 months at £21,398 + VAT)
 * - Q1 Rent: £38,516.40 (£32,097 + VAT) - then monthly at reduced rate for 2026
 * - Service Charge: £3,000/quarter
 * - Insurance: £4,800/year
 * - Business Rates: £5,000/month
 * 
 * 2026 Rent: 50% reduced = £10,699 + VAT = £12,838.80/month
 * 2027+ Rent: Full rate = £21,398 + VAT = £25,677.60/month
 * 
 * SHOWROOM (Started February 2025)
 * - £14,400/month from February 2025 onwards
 * 
 * MISCELLANEOUS (2025)
 * - £600/month: March-July 2025
 * - £3,000/month: August-December 2025
 * 
 * EMPLOYEE SALARIES (2025)
 * - March: £12,292
 * - April: £18,875
 * - May: £21,561
 * - June: £21,894
 * - July: £21,894
 * - August-December: £22,917/month
 */

export const generateHOCOperationalCosts = (): OperationalCost[] => {
  const costs: OperationalCost[] = [];

  // ============================================
  // SHOWROOM RENT - £14,400/month from Feb 2025
  // ============================================
  const showroomMonths2025 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Feb-Dec 2025
  showroomMonths2025.forEach(month => {
    costs.push({
      id: generateId(),
      date: date(2025, month),
      amount: 14400,
      category: 'Showroom Rent',
      costType: 'fixed',
      description: `Showroom rent - ${new Date(2025, month - 1).toLocaleString('default', { month: 'long' })} 2025`,
      isRecurring: true,
    });
  });

  // ============================================
  // MISCELLANEOUS COSTS - 2025
  // ============================================
  // £600/month: March-July 2025
  [3, 4, 5, 6, 7].forEach(month => {
    costs.push({
      id: generateId(),
      date: date(2025, month),
      amount: 600,
      category: 'Miscellaneous',
      costType: 'variable',
      description: `Misc expenses - ${new Date(2025, month - 1).toLocaleString('default', { month: 'long' })} 2025`,
    });
  });

  // £3,000/month: August-December 2025
  [8, 9, 10, 11, 12].forEach(month => {
    costs.push({
      id: generateId(),
      date: date(2025, month),
      amount: 3000,
      category: 'Miscellaneous',
      costType: 'variable',
      description: `Misc expenses - ${new Date(2025, month - 1).toLocaleString('default', { month: 'long' })} 2025`,
    });
  });

  // ============================================
  // EMPLOYEE SALARIES - 2025
  // ============================================
  const salaries2025: { month: number; amount: number }[] = [
    { month: 3, amount: 12292 },   // March
    { month: 4, amount: 18875 },   // April
    { month: 5, amount: 21561 },   // May
    { month: 6, amount: 21894 },   // June
    { month: 7, amount: 21894 },   // July
    { month: 8, amount: 22917 },   // August
    { month: 9, amount: 22917 },   // September
    { month: 10, amount: 22917 },  // October
    { month: 11, amount: 22917 },  // November
    { month: 12, amount: 22917 },  // December
  ];

  salaries2025.forEach(({ month, amount }) => {
    costs.push({
      id: generateId(),
      date: date(2025, month),
      amount,
      category: 'Employee Salaries',
      costType: 'variable',
      description: `Staff salaries - ${new Date(2025, month - 1).toLocaleString('default', { month: 'long' })} 2025`,
    });
  });

  // ============================================
  // WAREHOUSE COSTS - Starting January 2026
  // ============================================

  // Professional Fees - £10,930.50 + VAT = £13,116.60 (one-time)
  costs.push({
    id: generateId(),
    date: date(2026, 1),
    amount: 13116.60,
    category: 'Warehouse - Professional Fees',
    costType: 'fixed',
    description: 'Professional fees for warehouse setup (inc VAT)',
  });

  // Rental Deposit - 7 months × £21,398 = £149,786 + VAT (£29,957.20) = £179,743.20
  costs.push({
    id: generateId(),
    date: date(2026, 1),
    amount: 179743.20,
    category: 'Warehouse - Deposit',
    costType: 'fixed',
    description: '7 months rental deposit (based on full rate £21,398/month + VAT)',
  });

  // Q1 2026 Rent - £32,097 + VAT = £38,516.40
  costs.push({
    id: generateId(),
    date: date(2026, 1),
    amount: 38516.40,
    category: 'Warehouse Rent',
    costType: 'fixed',
    description: 'Q1 2026 warehouse rent (50% reduced rate + VAT)',
    isRecurring: true,
  });

  // Q2-Q4 2026 Rent at reduced rate: £10,699 × 3 + VAT per quarter = £38,516.40 per quarter
  [4, 7, 10].forEach(month => {
    const quarterName = month === 4 ? 'Q2' : month === 7 ? 'Q3' : 'Q4';
    costs.push({
      id: generateId(),
      date: date(2026, month),
      amount: 38516.40,
      category: 'Warehouse Rent',
      costType: 'fixed',
      description: `${quarterName} 2026 warehouse rent (50% reduced rate + VAT)`,
      isRecurring: true,
    });
  });

  // Service Charge - £3,000/quarter (starting Q1 2026)
  [1, 4, 7, 10].forEach(month => {
    const quarterName = month === 1 ? 'Q1' : month === 4 ? 'Q2' : month === 7 ? 'Q3' : 'Q4';
    costs.push({
      id: generateId(),
      date: date(2026, month),
      amount: 3000,
      category: 'Warehouse - Service Charge',
      costType: 'fixed',
      description: `${quarterName} 2026 service charge`,
      isRecurring: true,
    });
  });

  // Insurance - £4,800/year (January 2026)
  costs.push({
    id: generateId(),
    date: date(2026, 1),
    amount: 4800,
    category: 'Warehouse - Insurance',
    costType: 'fixed',
    description: 'Annual warehouse insurance 2026',
    isRecurring: true,
  });

  // Business Rates - £5,000/month (starting January 2026)
  for (let month = 1; month <= 12; month++) {
    costs.push({
      id: generateId(),
      date: date(2026, month),
      amount: 5000,
      category: 'Warehouse - Business Rates',
      costType: 'fixed',
      description: `Business rates - ${new Date(2026, month - 1).toLocaleString('default', { month: 'long' })} 2026`,
      isRecurring: true,
    });
  }

  // Showroom rent continues in 2026
  for (let month = 1; month <= 12; month++) {
    costs.push({
      id: generateId(),
      date: date(2026, month),
      amount: 14400,
      category: 'Showroom Rent',
      costType: 'fixed',
      description: `Showroom rent - ${new Date(2026, month - 1).toLocaleString('default', { month: 'long' })} 2026`,
      isRecurring: true,
    });
  }

  // Sort by date
  costs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return costs;
};

// Summary of expected costs
export const getHOCCostsSummary = () => {
  const costs = generateHOCOperationalCosts();
  
  const total2025 = costs
    .filter(c => c.date.startsWith('2025'))
    .reduce((sum, c) => sum + c.amount, 0);
  
  const total2026 = costs
    .filter(c => c.date.startsWith('2026'))
    .reduce((sum, c) => sum + c.amount, 0);
  
  const fixedTotal = costs
    .filter(c => c.costType === 'fixed')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const variableTotal = costs
    .filter(c => c.costType === 'variable')
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    totalCosts: total2025 + total2026,
    total2025,
    total2026,
    fixedTotal,
    variableTotal,
    costCount: costs.length,
  };
};

