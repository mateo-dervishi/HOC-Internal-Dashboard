export type PaymentType = 'full_account' | 'account_cp';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  stage: 'upfront' | 'production' | 'delivery';
  type: 'account' | 'fees';  // 'fees' = cash (non-VATable)
  description?: string;
}

export interface SupplierCost {
  id: string;
  date: string;
  amount: number;
  supplier: string;
  description?: string;
  includesVat?: boolean;
}

export interface Project {
  id: string;
  code: string;           // e.g., "P39"
  clientName: string;     // e.g., "Lydia"
  totalValue: number;     // Total project value (user enters this)
  paymentType: PaymentType;
  payments: Payment[];
  supplierCosts: SupplierCost[];
  createdAt: string;
  status: 'active' | 'completed' | 'on_hold';
  notes?: string;
}

export interface OperationalCost {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
}

export interface DashboardState {
  projects: Project[];
  operationalCosts: OperationalCost[];
}

// VAT rate
export const VAT_RATE = 0.20;

// Helper to calculate project value breakdown based on payment type
// Full Account: 100% goes through account (VATable)
// Account/CP: 60% account (VATable), 40% fees/cash (non-VATable)
export const calculateProjectBreakdown = (totalValue: number, paymentType: PaymentType) => {
  if (paymentType === 'account_cp') {
    const accountPortion = totalValue * 0.6;  // 60% account
    const feesPortion = totalValue * 0.4;     // 40% cash/fees
    const vatOnAccount = accountPortion * VAT_RATE;
    
    return {
      accountExVat: accountPortion,
      feesTotal: feesPortion,
      vatAmount: vatOnAccount,
      totalIncVat: accountPortion + vatOnAccount + feesPortion,
    };
  }
  
  // Full account - everything is VATable
  const vatAmount = totalValue * VAT_RATE;
  return {
    accountExVat: totalValue,
    feesTotal: 0,
    vatAmount,
    totalIncVat: totalValue + vatAmount,
  };
};

// Helper to calculate expected payments at each stage (20/70/10)
export const calculateExpectedPayments = (
  totalValue: number,
  paymentType: PaymentType
): {
  upfront: { account: number; fees: number; accountVat: number };
  production: { account: number; fees: number; accountVat: number };
  delivery: { account: number; fees: number; accountVat: number };
  totals: { account: number; fees: number; vat: number; total: number };
} => {
  const breakdown = calculateProjectBreakdown(totalValue, paymentType);
  
  return {
    upfront: {
      account: breakdown.accountExVat * 0.2,
      fees: breakdown.feesTotal * 0.2,
      accountVat: breakdown.vatAmount * 0.2,
    },
    production: {
      account: breakdown.accountExVat * 0.7,
      fees: breakdown.feesTotal * 0.7,
      accountVat: breakdown.vatAmount * 0.7,
    },
    delivery: {
      account: breakdown.accountExVat * 0.1,
      fees: breakdown.feesTotal * 0.1,
      accountVat: breakdown.vatAmount * 0.1,
    },
    totals: {
      account: breakdown.accountExVat + breakdown.vatAmount,
      fees: breakdown.feesTotal,
      vat: breakdown.vatAmount,
      total: breakdown.totalIncVat,
    },
  };
};

// Helper to calculate project financials
export const calculateProjectFinancials = (project: Project) => {
  const breakdown = calculateProjectBreakdown(project.totalValue, project.paymentType);
  
  // Payments received
  const accountPayments = project.payments
    .filter(p => p.type === 'account')
    .reduce((sum, p) => sum + p.amount, 0);
  const feesPayments = project.payments
    .filter(p => p.type === 'fees')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalInflows = accountPayments + feesPayments;
  
  // Supplier costs
  const totalSupplierCosts = project.supplierCosts.reduce((sum, c) => sum + c.amount, 0);
  
  // Profit calculations
  const grossProfit = totalInflows - totalSupplierCosts;
  const profitMargin = totalInflows > 0 ? (grossProfit / totalInflows) * 100 : 0;
  
  return {
    // Value breakdown
    accountExVat: breakdown.accountExVat,
    feesTotal: breakdown.feesTotal,
    vatAmount: breakdown.vatAmount,
    totalProjectValue: breakdown.totalIncVat,
    
    // Payments received
    accountPayments,
    feesPayments,
    totalInflows,
    
    // Costs
    totalSupplierCosts,
    
    // Profit
    grossProfit,
    profitMargin,
  };
};
