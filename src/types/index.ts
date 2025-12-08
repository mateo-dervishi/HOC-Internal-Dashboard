// Valuation - represents a billing milestone (V1, V2, V3, etc.)
export interface Valuation {
  id: string;
  name: string;              // e.g., "V1 - Deposit", "V2 - Production"
  date: string;
  
  // Values for this valuation
  grandTotal: number;        // Total goods value for this valuation (ex VAT)
  fees: number;              // Cash/Fees portion (non-VAT) - only if CP enabled
  omissions: number;         // Deductions (enter as positive, will be subtracted)
  
  // Calculated
  // subtotal = grandTotal - fees - omissions
  // vat = subtotal * 0.2
  // totalIncVat = subtotal + vat
  
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  valuationId?: string;      // Link to which valuation this payment is for
  type: 'account' | 'cash';  // Account (VATable) or Cash (non-VAT)
  description?: string;
}

export interface SupplierCost {
  id: string;
  date: string;
  amount: number;
  supplier: string;
  description?: string;
}

export interface Project {
  id: string;
  code: string;              // e.g., "P39", "2 Park Crescent"
  clientName: string;
  address?: string;
  
  // CP (Cash Payment) toggle
  hasCashPayment: boolean;   // If true, project has cash/fees component
  
  // Data
  valuations: Valuation[];
  payments: Payment[];
  supplierCosts: SupplierCost[];
  
  createdAt: string;
  status: 'active' | 'completed' | 'on_hold';
  notes?: string;
}

// Operational Costs - Fixed vs Variable
export type CostType = 'fixed' | 'variable';

export interface OperationalCost {
  id: string;
  date: string;
  amount: number;
  category: string;
  costType: CostType;        // Fixed or Variable
  description?: string;
  isRecurring?: boolean;     // For fixed costs that repeat monthly
}

export interface DashboardState {
  projects: Project[];
  operationalCosts: OperationalCost[];
}

// VAT rate
export const VAT_RATE = 0.20;

// Helper to calculate valuation totals
export const calculateValuationTotals = (valuation: Valuation, hasCashPayment: boolean) => {
  const fees = hasCashPayment ? valuation.fees : 0;
  const subtotal = valuation.grandTotal - fees - valuation.omissions;
  const vat = subtotal * VAT_RATE;
  const totalIncVat = subtotal + vat;
  
  return {
    grandTotal: valuation.grandTotal,
    fees,
    omissions: valuation.omissions,
    subtotal,
    vat,
    totalIncVat,
    totalWithFees: totalIncVat + fees,  // Total client pays for this valuation
  };
};

// Helper to calculate project financials
export const calculateProjectFinancials = (project: Project) => {
  // Sum all valuations
  let totalGrandTotal = 0;
  let totalFees = 0;
  let totalOmissions = 0;
  let totalSubtotal = 0;
  let totalVat = 0;
  let totalIncVat = 0;
  
  project.valuations.forEach(v => {
    const calc = calculateValuationTotals(v, project.hasCashPayment);
    totalGrandTotal += calc.grandTotal;
    totalFees += calc.fees;
    totalOmissions += calc.omissions;
    totalSubtotal += calc.subtotal;
    totalVat += calc.vat;
    totalIncVat += calc.totalIncVat;
  });
  
  const totalProjectValue = totalIncVat + totalFees;
  
  // Payments received
  const accountPayments = project.payments
    .filter(p => p.type === 'account')
    .reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = project.payments
    .filter(p => p.type === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalInflows = accountPayments + cashPayments;
  
  // Supplier costs
  const totalSupplierCosts = project.supplierCosts.reduce((sum, c) => sum + c.amount, 0);
  
  // Profit calculations
  const grossProfit = totalInflows - totalSupplierCosts;
  const profitMargin = totalInflows > 0 ? (grossProfit / totalInflows) * 100 : 0;
  
  return {
    // Valuation totals
    totalGrandTotal,
    totalFees,
    totalOmissions,
    totalSubtotal,
    totalVat,
    totalIncVat,
    totalProjectValue,
    
    // Payments
    accountPayments,
    cashPayments,
    totalInflows,
    
    // Costs & Profit
    totalSupplierCosts,
    grossProfit,
    profitMargin,
  };
};

// Common fixed cost categories
export const FIXED_COST_CATEGORIES = [
  'Warehouse Rent',
  'Office Rent',
  'Insurance',
  'Software Subscriptions',
  'Utilities',
  'Equipment Lease',
  'Storage',
  'Other Fixed',
];

// Common variable cost categories
export const VARIABLE_COST_CATEGORIES = [
  'Salaries',
  'Contractor Payments',
  'Commissions',
  'Transport/Fuel',
  'Marketing',
  'Office Supplies',
  'Professional Services',
  'Travel',
  'Entertainment',
  'Other Variable',
];
