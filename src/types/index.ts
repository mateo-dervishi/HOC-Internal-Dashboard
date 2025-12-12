// Valuation - represents a billing milestone (V1, V2, V3, etc.)
export interface Valuation {
  id: string;
  name: string;              // e.g., "V1 - Deposit", "V2 - Production"
  date: string;
  
  // Values for this valuation
  grandTotal: number;        // Total contract value (Fees + Subtotal)
  fees: number;              // Fees portion (non-VAT)
  omissions: number;         // Cancelled items (deducted from VATable portion)
  vatRate: number;           // VAT rate (e.g., 0.20 for 20%, can vary per project)
  
  // Calculated:
  // subtotal = grandTotal - fees - omissions (VATable portion after cancellations)
  // vat = subtotal * vatRate
  // gross = grandTotal - omissions + vat
  
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  vatRate?: number;          // VAT rate as decimal (e.g., 0.20 for 20%)
  valuationName?: string;    // Name of valuation this payment is for (e.g., "V1", "V2")
  type: 'account' | 'cash';  // Account (VATable) or Fee (non-VAT)
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
  
  // Fees toggle (previously CP/Cash Payment)
  hasCashPayment: boolean;   // If true, project has fees component
  
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
// Formula: Grand Total = Fees + Subtotal + Omissions, where Subtotal is VATable after omissions
export const calculateValuationTotals = (valuation: Valuation) => {
  const fees = valuation.fees || 0;
  const omissions = valuation.omissions || 0;
  // Subtotal is the VATable portion (grandTotal - fees - omissions)
  const subtotal = valuation.grandTotal - fees - omissions;
  // Use per-valuation VAT rate (default to 20% if not set)
  const vatRate = valuation.vatRate ?? VAT_RATE;
  // VAT only applies to subtotal (not fees, and omissions are deducted)
  const vat = subtotal * vatRate;
  // Gross = Grand Total - Omissions + VAT (what client actually pays)
  const gross = valuation.grandTotal - omissions + vat;
  
  return {
    grandTotal: valuation.grandTotal,
    fees,
    omissions,
    subtotal,
    vatRate,
    vat,
    gross,
    totalIncVat: subtotal + vat,  // VATable portion with VAT
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
  let totalGross = 0;
  
  project.valuations.forEach(v => {
    const calc = calculateValuationTotals(v);
    totalGrandTotal += calc.grandTotal;
    totalFees += calc.fees;
    totalOmissions += calc.omissions;
    totalSubtotal += calc.subtotal;
    totalVat += calc.vat;
    totalIncVat += calc.totalIncVat;
    totalGross += calc.gross;
  });
  
  // Payments received (including VAT)
  const accountPayments = project.payments
    .filter(p => p.type === 'account')
    .reduce((sum, p) => {
      const vatAmount = p.vatRate ? p.amount * p.vatRate : 0;
      return sum + p.amount + vatAmount;
    }, 0);
  const feePayments = project.payments
    .filter(p => p.type === 'cash')
    .reduce((sum, p) => {
      const vatAmount = p.vatRate ? p.amount * p.vatRate : 0;
      return sum + p.amount + vatAmount;
    }, 0);
  const totalInflows = accountPayments + feePayments;
  
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
    totalGross,  // Gross = Grand Total - Omissions + VAT (replaces totalProjectValue)
    
    // Payments
    accountPayments,
    feePayments,  // Renamed from cashPayments
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
