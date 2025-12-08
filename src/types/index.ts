export type PaymentType = 'full_account' | 'cash_payment';

export interface PaymentTerms {
  upfront: number;      // 20%
  production: number;   // 70%
  delivery: number;     // 10%
}

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
  
  // Project value breakdown
  goodsTotal: number;     // Total value of goods/services (ex VAT)
  feesTotal: number;      // Fees/Cash portion (non-VATable)
  
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

// Helper to calculate total project value
export const calculateProjectValue = (project: Project) => {
  const vatOnGoods = project.goodsTotal * VAT_RATE;
  const totalIncVat = project.goodsTotal + vatOnGoods + project.feesTotal;
  
  return {
    goodsTotal: project.goodsTotal,
    feesTotal: project.feesTotal,       // Cash/Fees - non VATable
    vatAmount: vatOnGoods,
    totalExVat: project.goodsTotal + project.feesTotal,
    totalIncVat,
  };
};

// Helper to calculate expected payments at each stage
// Payment terms: 20/70/10
// If cash payment (CP): 60% account, 40% fees (cash)
export const calculateExpectedPayments = (
  goodsTotal: number,
  feesTotal: number,
  paymentType: PaymentType
): {
  upfront: { account: number; fees: number; accountVat: number };
  production: { account: number; fees: number; accountVat: number };
  delivery: { account: number; fees: number; accountVat: number };
  totals: { account: number; fees: number; vat: number; total: number };
} => {
  // Account portion gets VAT, Fees don't
  const accountVat = goodsTotal * VAT_RATE;
  const accountIncVat = goodsTotal + accountVat;
  
  return {
    upfront: {
      account: goodsTotal * 0.2,
      fees: feesTotal * 0.2,
      accountVat: accountVat * 0.2,
    },
    production: {
      account: goodsTotal * 0.7,
      fees: feesTotal * 0.7,
      accountVat: accountVat * 0.7,
    },
    delivery: {
      account: goodsTotal * 0.1,
      fees: feesTotal * 0.1,
      accountVat: accountVat * 0.1,
    },
    totals: {
      account: accountIncVat,
      fees: feesTotal,
      vat: accountVat,
      total: accountIncVat + feesTotal,
    },
  };
};

// Helper to calculate project financials
export const calculateProjectFinancials = (project: Project) => {
  const projectValue = calculateProjectValue(project);
  
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
    goodsTotal: project.goodsTotal,
    feesTotal: project.feesTotal,
    vatAmount: projectValue.vatAmount,
    totalProjectValue: projectValue.totalIncVat,
    
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

// For backward compatibility - calculate total value
export const getTotalProjectValue = (project: Project): number => {
  return calculateProjectValue(project).totalIncVat;
};
